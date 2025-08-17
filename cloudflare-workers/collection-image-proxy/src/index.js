/**
 * Cloudflare Worker for Collection Images with Real-Time Transformations
 * 
 * Handles /collections/category/post-slug.ext URLs with:
 * - Real-time image transformations via Cloudflare's cf.image API
 * - URL parameter support (?w=400&h=300&q=85&fit=cover&format=auto)
 * - Backward compatibility with legacy URL formats
 * - Optimized caching and performance
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Check if this is an image request
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    const isImageRequest = imageExtensions.some(ext => pathname.endsWith(ext));
    
    if (!isImageRequest) {
      // Not an image request - pass through to origin
      return fetch(request);
    }
    
    // Handle hierarchical structure: /collections/category/post-slug/image-name.ext
    const parts = pathname.split('/').filter(part => part.length > 0);
    
    // Validate URL format: ['collections', ...] with at least 3 parts
    if (parts.length < 3 || parts[0] !== 'collections') {
      return new Response('Invalid collections URL format', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Extract filename and extension
    const filenameWithExt = parts[parts.length - 1];
    const lastDotIndex = filenameWithExt.lastIndexOf('.');
    const filename = filenameWithExt.substring(0, lastDotIndex);
    const extension = filenameWithExt.substring(lastDotIndex);
    
    // Create base slug for new format: category/post-slug
    // Handle both formats: /collections/category/post-slug.ext and /collections/category/post-slug/filename.ext
    let baseSlug;
    if (parts.length === 3) {
      // Format: /collections/category/post-slug.ext
      const nameWithoutExt = filenameWithExt.substring(0, lastDotIndex);
      baseSlug = `${parts[1]}/${nameWithoutExt}`.toLowerCase();
    } else {
      // Format: /collections/category/post-slug/filename.ext
      baseSlug = parts.slice(1, -1).join('/').toLowerCase();
    }
    
    // Parse transformation parameters from URL query string
    const transformParams = this.parseTransformParams(url.searchParams);
    
    
    try {
      let sanityUrl = null;
      let mappingType = 'unknown';
      
      // STEP 1: Try new single-mapping format first (real-time transforms)
      sanityUrl = await env.ASSET_MAPPINGS.get(baseSlug);
      if (sanityUrl) {
        mappingType = 'real-time';
      }
      
      // STEP 2: Fallback to old 4-size mapping format for backward compatibility
      if (!sanityUrl) {
        const oldSlug = `${baseSlug}/${filename}`.toLowerCase();
        sanityUrl = await env.ASSET_MAPPINGS.get(oldSlug);
        if (sanityUrl) {
          mappingType = 'legacy-4size';
        }
      }
      
      // STEP 3: No mapping found
      if (!sanityUrl) {
        return new Response('Collection image not found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
      
      // STEP 4: Apply transformations based on mapping type
      let imageResponse;
      
      if (mappingType === 'real-time' && Object.keys(transformParams).length > 0) {
        // NEW: Real-time transformations using Cloudflare's cf.image API
        imageResponse = await fetch(sanityUrl, {
          cf: {
            image: {
              width: transformParams.width,
              height: transformParams.height,
              fit: transformParams.fit || 'cover',
              quality: transformParams.quality || 85,
              format: transformParams.format || 'auto'
            },
            // Enhanced caching
            cacheTtl: 604800, // 7 days edge cache
            cacheEverything: true,
            cacheKey: `collection-rt-${baseSlug}-${this.hashParams(transformParams)}`
          }
        });
      } else {
        // OLD: Direct fetch (for legacy mappings or no transform params)
        imageResponse = await fetch(sanityUrl, {
          cf: { 
            cacheTtl: 432000, // 5 days cache (shorter for legacy)
            cacheEverything: true,
            cacheKey: `collection-legacy-${baseSlug}-${filename}`
          }
        });
      }
      
      if (!imageResponse.ok) {
        return new Response('Failed to fetch image from origin', { 
          status: imageResponse.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // STEP 5: Return optimized response
      const contentType = this.getContentType(transformParams.format, extension);
      
      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          // Core headers
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          
          // CORS headers
          'Access-Control-Allow-Origin': '*',
          
          // SEO headers
          'X-Robots-Tag': 'all',
          
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          
          // Performance headers
          'Accept-Ranges': 'bytes'
        }
      });
      
    } catch (error) {
      return new Response('Internal server error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  },
  
  /**
   * Parse URL query parameters into Cloudflare image transformation options
   * Supports both Sanity-compatible and Cloudflare-specific parameters
   */
  parseTransformParams(searchParams) {
    const transforms = {};
    
    // Width and height
    if (searchParams.has('w')) {
      const width = parseInt(searchParams.get('w'));
      if (width > 0 && width <= 2000) transforms.width = width;
    }
    if (searchParams.has('h')) {
      const height = parseInt(searchParams.get('h'));
      if (height > 0 && height <= 2000) transforms.height = height;
    }
    
    // Quality (1-100)
    if (searchParams.has('q')) {
      const quality = parseInt(searchParams.get('q'));
      if (quality >= 1 && quality <= 100) transforms.quality = quality;
    }
    
    // Format (auto, webp, jpeg, png, avif)
    if (searchParams.has('format')) {
      const format = searchParams.get('format').toLowerCase();
      if (['auto', 'webp', 'jpeg', 'png', 'avif'].includes(format)) {
        transforms.format = format;
      }
    }
    
    // Fit mode (cover, contain, crop, scale-down, pad)
    if (searchParams.has('fit')) {
      const fit = searchParams.get('fit').toLowerCase();
      if (['cover', 'contain', 'crop', 'scale-down', 'pad'].includes(fit)) {
        transforms.fit = fit;
      }
    }
    
    return transforms;
  },
  
  /**
   * Generate a short hash of transformation parameters for cache keys
   */
  hashParams(params) {
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < paramString.length; i++) {
      const char = paramString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },
  
  /**
   * Determine content type based on format transformation or original extension
   */
  getContentType(format, originalExtension) {
    if (format) {
      const formatMap = {
        'webp': 'image/webp',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'avif': 'image/avif',
        'auto': 'image/webp', // Default for auto format
      };
      return formatMap[format] || 'image/webp';
    }
    
    // Fall back to original extension
    const contentTypeMap = {
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    return contentTypeMap[originalExtension.toLowerCase()] || 'image/jpeg';
  },
  
  /**
   * Handle CORS preflight requests
   */
  async options(request, env) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
};
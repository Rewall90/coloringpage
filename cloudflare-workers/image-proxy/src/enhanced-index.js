/**
 * Enhanced Cloudflare Worker for serving images with hierarchical URLs
 * Proxies images from Sanity CDN with SEO-friendly URLs + Cloudflare image transformations
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Extract the slug from hierarchical image paths
    // Format: /category/image-name.webp -> category/image-name
    const pathname = url.pathname;
    
    // Check if this is an image request
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    const isImageRequest = imageExtensions.some(ext => pathname.endsWith(ext));
    
    if (!isImageRequest) {
      // Not an image request - pass through to origin
      return fetch(request);
    }
    
    // Handle hierarchical structure: /main-category/category/image-name.ext
    const parts = pathname.split('/').filter(part => part.length > 0);
    
    // Check if it starts with 'main-category' and has at least 3 parts: ['main-category', 'category', 'filename.ext']
    if (parts.length < 3 || parts[0] !== 'main-category') {
      return new Response('Invalid main-category URL format', { status: 404 });
    }
    
    // Extract filename without extension
    const filenameWithExt = parts[parts.length - 1];
    const lastDotIndex = filenameWithExt.lastIndexOf('.');
    const filename = filenameWithExt.substring(0, lastDotIndex);
    const extension = filenameWithExt.substring(lastDotIndex);
    
    // Create hierarchical slug without the 'main-category' prefix: category/image-name
    const slug = parts.slice(1, -1).join('/') + '/' + filename;
    const slugLower = slug.toLowerCase();
    
    // Parse query parameters for image transformations
    const queryParams = url.searchParams;
    const transformParams = this.parseTransformParams(queryParams);
    
    // Log for debugging (can be removed in production)
    console.log('Requested image slug:', slugLower);
    console.log('Transform params:', transformParams);
    
    try {
      // Get the Sanity URL from KV store (using same store as PDFs)
      const sanityUrl = await env.ASSET_MAPPINGS.get(slugLower);
      
      if (!sanityUrl) {
        console.log('Image slug not found in KV:', slugLower);
        return new Response('Image not found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      // Fetch and transform the image from Sanity CDN
      const imageResponse = await fetch(sanityUrl, {
        cf: { 
          // Apply Cloudflare image transformations
          ...transformParams,
          // Cache images longer than PDFs (7 days edge cache)
          cacheTtl: 604800,
          cacheEverything: true,
          // Cache key includes the slug and transform params for proper caching
          cacheKey: `image-${slugLower}-${JSON.stringify(transformParams)}`
        }
      });
      
      if (!imageResponse.ok) {
        console.error('Failed to fetch image from Sanity:', imageResponse.status);
        return new Response('Failed to fetch image', { 
          status: imageResponse.status 
        });
      }
      
      // Determine content type based on transformation or original extension
      const contentType = this.getContentType(transformParams.format, extension);
      
      // Return the transformed image with optimized headers
      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          // Set content type
          'Content-Type': contentType,
          
          // Cache for 1 year in browser (images change less frequently)
          'Cache-Control': 'public, max-age=31536000, immutable',
          
          // Add CORS headers
          'Access-Control-Allow-Origin': '*',
          
          // SEO-friendly headers
          'X-Robots-Tag': 'all',
          
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          
          // Image-specific headers
          'Accept-Ranges': 'bytes',
          
          // Add transform info for debugging
          'X-Transform-Applied': Object.keys(transformParams).length > 0 ? 'true' : 'false',
        }
      });
      
    } catch (error) {
      console.error('Image worker error:', error);
      return new Response('Internal server error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
  },
  
  /**
   * Parse URL query parameters into Cloudflare image transformation options
   * Supports Sanity-compatible parameters plus additional Cloudflare features
   */
  parseTransformParams(searchParams) {
    const transforms = {};
    
    // Width and height
    if (searchParams.has('w')) {
      transforms.width = parseInt(searchParams.get('w'));
    }
    if (searchParams.has('h')) {
      transforms.height = parseInt(searchParams.get('h'));
    }
    
    // Quality (1-100, default 85)
    if (searchParams.has('q')) {
      const quality = parseInt(searchParams.get('q'));
      if (quality >= 1 && quality <= 100) {
        transforms.quality = quality;
      }
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
    
    // Cropping (auto, or specific coordinates)
    if (searchParams.has('crop')) {
      transforms.crop = searchParams.get('crop');
    }
    
    // Additional Cloudflare-specific transforms
    
    // Rotation (0, 90, 180, 270)
    if (searchParams.has('rotate')) {
      const rotate = parseInt(searchParams.get('rotate'));
      if ([0, 90, 180, 270].includes(rotate)) {
        transforms.rotate = rotate;
      }
    }
    
    // Flip (h, v, or both)
    if (searchParams.has('flip')) {
      const flip = searchParams.get('flip').toLowerCase();
      if (['h', 'v', 'hv'].includes(flip)) {
        transforms.flip = flip;
      }
    }
    
    // Exposure adjustment (0.5 = darker, 2.0 = lighter)
    if (searchParams.has('exposure')) {
      const exposure = parseFloat(searchParams.get('exposure'));
      if (exposure >= 0.1 && exposure <= 5.0) {
        transforms.exposure = exposure;
      }
    }
    
    // Background color for pad mode
    if (searchParams.has('bg')) {
      transforms.background = searchParams.get('bg');
    }
    
    return transforms;
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
        'auto': 'image/webp', // Default for auto
      };
      return formatMap[format] || 'image/jpeg';
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
  
  // Handle CORS preflight requests
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
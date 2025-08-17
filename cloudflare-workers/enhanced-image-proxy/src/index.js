/**
 * Enhanced Cloudflare Worker for SEO-friendly URLs + Dynamic Image Transformations
 * Supports: /collections/category/item/image.webp?w=300&h=400&q=85&fit=cover
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Extract the slug from hierarchical image paths
    const pathname = url.pathname;
    
    // Check if this is an image request
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    const isImageRequest = imageExtensions.some(ext => pathname.includes(ext));
    
    if (!isImageRequest) {
      return new Response('Not an image request', { status: 404 });
    }
    
    // Parse URL: /collections/category/item/image.webp?w=300&h=400
    const parts = pathname.split('/').filter(part => part.length > 0);
    
    // Support both collections and main-category paths
    const isCollectionPath = parts[0] === 'collections' && parts.length >= 4;
    const isCategoryPath = parts[0] === 'main-category' && parts.length >= 3;
    
    if (!isCollectionPath && !isCategoryPath) {
      return new Response('Invalid URL format', { status: 404 });
    }
    
    // Extract base image key (remove file extension and size suffixes)
    let baseImageKey;
    if (isCollectionPath) {
      // /collections/category/item/image.webp -> category/item/image
      const [, category, item, filename] = parts;
      const baseName = filename.split('.')[0]; // Remove extension
      baseImageKey = `${category}/${item}/${baseName}`;
    } else {
      // /main-category/category/image.webp -> category/image  
      const [, category, filename] = parts;
      const baseName = filename.split('.')[0];
      baseImageKey = `${category}/${baseName}`;
    }
    
    console.log('Base image key:', baseImageKey);
    
    try {
      // Get the base Sanity URL from KV store
      const sanityUrl = await env.ASSET_MAPPINGS.get(baseImageKey);
      
      if (!sanityUrl) {
        console.log('Base image not found in KV:', baseImageKey);
        return new Response('Image not found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Extract transformation parameters from query string
      const width = url.searchParams.get('w');
      const height = url.searchParams.get('h');
      const quality = url.searchParams.get('q') || '85';
      const fit = url.searchParams.get('fit') || 'cover';
      const format = url.searchParams.get('f') || 'webp';
      
      // Build Cloudflare image transformation config
      const imageConfig = {};
      
      if (width) imageConfig.width = parseInt(width);
      if (height) imageConfig.height = parseInt(height);
      if (quality) imageConfig.quality = parseInt(quality);
      if (fit) imageConfig.fit = fit;
      if (format) imageConfig.format = format;
      
      console.log('Transforming image:', sanityUrl, 'with config:', imageConfig);
      
      // Fetch and transform image using Cloudflare's cf.image
      const imageResponse = await fetch(sanityUrl, {
        cf: { 
          image: imageConfig,
          // Cache transformed images for 7 days
          cacheTtl: 604800,
          cacheEverything: true,
          cacheKey: `enhanced-${baseImageKey}-${width}-${height}-${quality}-${fit}`
        }
      });
      
      if (!imageResponse.ok) {
        console.error('Failed to fetch/transform image:', imageResponse.status);
        return new Response('Failed to transform image', { 
          status: imageResponse.status 
        });
      }
      
      // Return transformed image with optimized headers
      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type') || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Robots-Tag': 'all',
          'X-Content-Type-Options': 'nosniff',
          'Accept-Ranges': 'bytes',
          // Add transformation info for debugging
          'X-Transform-Config': JSON.stringify(imageConfig),
          'X-Base-Image': baseImageKey,
        }
      });
      
    } catch (error) {
      console.error('Enhanced image worker error:', error);
      return new Response('Internal server error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
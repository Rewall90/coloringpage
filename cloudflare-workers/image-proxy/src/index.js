/**
 * Cloudflare Worker for serving images with hierarchical URLs
 * Proxies images from Sanity CDN with SEO-friendly URLs
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
    
    // Handle hierarchical structure: /images/category/image-name.ext
    const parts = pathname.split('/').filter(part => part.length > 0);
    
    // Check if it starts with 'images' and has at least 3 parts: ['images', 'category', 'filename.ext']
    if (parts.length < 3 || parts[0] !== 'images') {
      return new Response('Invalid image URL format', { status: 404 });
    }
    
    // Extract filename without extension
    const filenameWithExt = parts[parts.length - 1];
    const lastDotIndex = filenameWithExt.lastIndexOf('.');
    const filename = filenameWithExt.substring(0, lastDotIndex);
    const extension = filenameWithExt.substring(lastDotIndex);
    
    // Create hierarchical slug without the 'images' prefix: category/image-name
    const slug = parts.slice(1, -1).join('/') + '/' + filename;
    const slugLower = slug.toLowerCase();
    
    // Log for debugging (can be removed in production)
    console.log('Requested image slug:', slugLower);
    
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
      
      // Fetch the image from Sanity CDN
      const imageResponse = await fetch(sanityUrl, {
        cf: { 
          // Cache images longer than PDFs (7 days edge cache)
          cacheTtl: 604800,
          cacheEverything: true,
          // Cache key includes the slug for better cache management
          cacheKey: `image-${slugLower}`
        }
      });
      
      if (!imageResponse.ok) {
        console.error('Failed to fetch image from Sanity:', imageResponse.status);
        return new Response('Failed to fetch image', { 
          status: imageResponse.status 
        });
      }
      
      // Get the image content
      const imageContent = await imageResponse.arrayBuffer();
      
      // Determine content type based on extension
      const contentTypeMap = {
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
      };
      const contentType = contentTypeMap[extension.toLowerCase()] || 'image/jpeg';
      
      // Return the image with optimized headers
      return new Response(imageContent, {
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
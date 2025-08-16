/**
 * Cloudflare Worker for serving collection post images with hierarchical URLs
 * Handles responsive images for collection posts (like "Farm Animals Collection")
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Extract the slug from hierarchical collection paths
    // Format: /collections/category/post-slug/image-name.ext -> category/post-slug/image-name
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
    
    // Check if it starts with 'collections' and has at least 4 parts: ['collections', 'category', 'post-slug', 'filename.ext']
    if (parts.length < 4 || parts[0] !== 'collections') {
      return new Response('Invalid collections URL format', { status: 404 });
    }
    
    // Extract filename without extension
    const filenameWithExt = parts[parts.length - 1];
    const lastDotIndex = filenameWithExt.lastIndexOf('.');
    const filename = filenameWithExt.substring(0, lastDotIndex);
    const extension = filenameWithExt.substring(lastDotIndex);
    
    // Create hierarchical slug without the 'collections' prefix: category/post-slug/image-name
    const slug = parts.slice(1, -1).join('/') + '/' + filename;
    const slugLower = slug.toLowerCase();
    
    // Log for debugging (can be removed in production)
    console.log('Requested collection image slug:', slugLower);
    
    try {
      // Get the Sanity URL from KV store (using same store as other proxies)
      const sanityUrl = await env.ASSET_MAPPINGS.get(slugLower);
      
      if (!sanityUrl) {
        console.log('Collection image slug not found in KV:', slugLower);
        return new Response('Collection image not found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      // Fetch the image from Sanity CDN
      const imageResponse = await fetch(sanityUrl, {
        cf: { 
          // Cache collection images (5 days - shorter than category images since they change more often)
          cacheTtl: 432000,
          cacheEverything: true,
          // Cache key includes the slug for better cache management
          cacheKey: `collection-${slugLower}`
        }
      });
      
      if (!imageResponse.ok) {
        console.error('Failed to fetch collection image from Sanity:', imageResponse.status);
        return new Response('Failed to fetch collection image', { 
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
          
          // Cache for 6 months in browser (collection images change less frequently)
          'Cache-Control': 'public, max-age=15552000, immutable',
          
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
      console.error('Collection image worker error:', error);
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
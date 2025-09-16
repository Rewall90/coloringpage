/**
 * Cloudflare Worker for serving assets (PDFs and images) with hierarchical URLs
 * PDFs: Opens in browser (inline) instead of forcing download
 * Images: Serves with optimized caching headers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // DEBUG: Log all incoming requests
    console.log('🔥 INCOMING REQUEST:', url.pathname);

    // Extract the slug from hierarchical asset paths
    // Format: /category/post/filename.pdf -> category/post/filename
    // Format: /category/image-name.webp -> category/image-name
    const pathname = url.pathname;
    
    // Check if this is an asset request (PDF or image)
    const pdfExtensions = ['.pdf'];
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    const allExtensions = [...pdfExtensions, ...imageExtensions];
    
    const isAssetRequest = allExtensions.some(ext => pathname.endsWith(ext));
    const isPdfRequest = pdfExtensions.some(ext => pathname.endsWith(ext));
    const isImageRequest = imageExtensions.some(ext => pathname.endsWith(ext));
    
    if (!isAssetRequest) {
      // Not an asset request - pass through to origin
      return fetch(request);
    }
    
    // Handle hierarchical structure for both PDFs and images
    let workingPathname = pathname;

    // Strip /pdf/ prefix if present (for PDF requests routed via /pdf/*)
    if (workingPathname.startsWith('/pdf/')) {
      workingPathname = workingPathname.substring(4); // Remove '/pdf'
      console.log('🔧 Stripped /pdf/ prefix, new path:', workingPathname);
    }

    const parts = workingPathname.split('/').filter(part => part.length > 0);
    
    // Different validation for PDFs vs images
    if (isPdfRequest) {
      // PDFs: /category/post/filename.pdf (3+ parts)
      if (parts.length < 3) {
        return new Response('Invalid PDF URL format', { status: 404 });
      }
    } else if (isImageRequest) {
      // Images: /category/image-name.ext (2+ parts)
      if (parts.length < 2) {
        return new Response('Invalid image URL format', { status: 404 });
      }
    }
    
    // Extract filename without extension
    const filenameWithExt = parts[parts.length - 1];
    const lastDotIndex = filenameWithExt.lastIndexOf('.');
    const filename = filenameWithExt.substring(0, lastDotIndex);
    const extension = filenameWithExt.substring(lastDotIndex);
    
    // Create hierarchical slug: category/post/filename OR category/image-name
    const slug = parts.slice(0, -1).join('/') + '/' + filename;
    const slugLower = slug.toLowerCase();
    
    // Log for debugging (can be removed in production)
    console.log(`Requested ${isPdfRequest ? 'PDF' : 'image'} slug:`, slugLower);
    
    try {
      // DEBUG: Log KV lookup attempt
      console.log('🔍 KV LOOKUP for slug:', slugLower);

      // Get the Sanity URL from KV store
      const sanityUrl = await env.ASSET_MAPPINGS.get(slugLower);

      // DEBUG: Log KV result
      console.log('📦 KV RESULT:', sanityUrl ? 'FOUND' : 'NOT FOUND');

      if (!sanityUrl) {
        console.log('❌ Slug not found in KV:', slugLower);
        const assetType = isPdfRequest ? 'PDF' : 'image';
        return new Response(`${assetType} not found`, {
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      // Fetch the asset from Sanity CDN
      const assetResponse = await fetch(sanityUrl, {
        cf: { 
          // Cache images longer than PDFs (7 days vs 1 day)
          cacheTtl: isImageRequest ? 604800 : 86400,
          cacheEverything: true,
          // Cache key includes the asset type and slug
          cacheKey: `${isPdfRequest ? 'pdf' : 'img'}-${slugLower}`
        }
      });
      
      if (!assetResponse.ok) {
        console.error('Failed to fetch from Sanity:', assetResponse.status);
        const assetType = isPdfRequest ? 'PDF' : 'image';
        return new Response(`Failed to fetch ${assetType}`, { 
          status: assetResponse.status 
        });
      }
      
      // Get the asset content
      const assetContent = await assetResponse.arrayBuffer();
      
      // Return asset with appropriate headers
      if (isPdfRequest) {
        // PDF headers
        return new Response(assetContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}.pdf"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'X-Robots-Tag': 'all',
            'X-Content-Type-Options': 'nosniff',
          }
        });
      } else {
        // Image headers
        const contentTypeMap = {
          '.webp': 'image/webp',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png'
        };
        const contentType = contentTypeMap[extension.toLowerCase()] || 'image/jpeg';
        
        return new Response(assetContent, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'X-Robots-Tag': 'all',
            'X-Content-Type-Options': 'nosniff',
            'Accept-Ranges': 'bytes',
          }
        });
      }
      
    } catch (error) {
      console.error('Worker error:', error);
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
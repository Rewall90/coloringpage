/**
 * Cloudflare Worker for serving PDFs with proper filenames
 * Opens PDFs in browser (inline) instead of forcing download
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Extract the slug from hierarchical PDF paths
    // Format: /category/post/filename.pdf -> category/post/filename
    const pathname = url.pathname;
    
    if (!pathname.endsWith('.pdf')) {
      // Not a PDF request - pass through to origin
      return fetch(request);
    }
    
    // Handle hierarchical structure: /category/post/filename.pdf
    const parts = pathname.split('/').filter(part => part.length > 0);
    if (parts.length < 3 || !parts[parts.length - 1].endsWith('.pdf')) {
      return new Response('Invalid PDF URL format', { status: 404 });
    }
    
    // Extract filename without .pdf extension
    const filename = parts[parts.length - 1].replace('.pdf', '');
    // Create hierarchical slug: category/post/filename
    const slug = parts.slice(0, -1).join('/') + '/' + filename;
    const slugLower = slug.toLowerCase();
    
    // Log for debugging (can be removed in production)
    console.log('Requested slug:', slugLower);
    
    try {
      // Get the Sanity URL from KV store
      const sanityUrl = await env.PDF_MAPPINGS.get(slugLower);
      
      if (!sanityUrl) {
        console.log('Slug not found in KV:', slugLower);
        return new Response('PDF not found', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      // Fetch the PDF from Sanity CDN
      const pdfResponse = await fetch(sanityUrl, {
        cf: { 
          // Cache the PDF at Cloudflare edge for 1 day
          cacheTtl: 86400,
          cacheEverything: true,
          // Cache key includes the slug for better cache management
          cacheKey: `pdf-${slugLower}`
        }
      });
      
      if (!pdfResponse.ok) {
        console.error('Failed to fetch from Sanity:', pdfResponse.status);
        return new Response('Failed to fetch PDF', { 
          status: pdfResponse.status 
        });
      }
      
      // Get the PDF content
      const pdfContent = await pdfResponse.arrayBuffer();
      
      // Return the PDF with proper headers
      return new Response(pdfContent, {
        status: 200,
        headers: {
          // Set content type
          'Content-Type': 'application/pdf',
          
          // IMPORTANT: 'inline' opens in browser, 'attachment' forces download
          // We use 'inline' for SEO - Google can crawl it
          'Content-Disposition': `inline; filename="${filename}.pdf"`,
          
          // Cache for 1 year in browser
          'Cache-Control': 'public, max-age=31536000, immutable',
          
          // Add CORS headers if needed
          'Access-Control-Allow-Origin': '*',
          
          // SEO-friendly headers
          'X-Robots-Tag': 'all',
          
          // Security headers
          'X-Content-Type-Options': 'nosniff',
        }
      });
      
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
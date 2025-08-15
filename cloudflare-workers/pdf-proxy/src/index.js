/**
 * Cloudflare Worker for serving PDFs with proper filenames
 * Opens PDFs in browser (inline) instead of forcing download
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Extract the slug from the path
    // e.g., /pdf/robot-coloring-page.pdf -> robot-coloring-page
    const pathname = url.pathname;
    if (!pathname.startsWith('/pdf/')) {
      return new Response('Not found', { status: 404 });
    }
    
    const slug = pathname
      .replace('/pdf/', '')
      .replace('.pdf', '')
      .toLowerCase();
    
    // Log for debugging (can be removed in production)
    console.log('Requested slug:', slug);
    
    try {
      // Get the Sanity URL from KV store
      const sanityUrl = await env.PDF_MAPPINGS.get(slug);
      
      if (!sanityUrl) {
        console.log('Slug not found in KV:', slug);
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
          cacheKey: `pdf-${slug}`
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
          'Content-Disposition': `inline; filename="${slug}.pdf"`,
          
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
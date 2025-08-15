# PDF Proxy Cloudflare Worker

This Worker serves PDFs with SEO-friendly URLs that open in the browser for preview while maintaining proper filenames.

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/pdf-proxy
npm install
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create KV Namespace
```bash
npm run create-namespace
```

Copy the namespace ID from the output and update it in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "PDF_MAPPINGS"
id = "YOUR_NAMESPACE_ID_HERE"  # <-- Update this
```

### 4. Deploy the Worker
```bash
npm run deploy
```

### 5. Configure Route in Cloudflare Dashboard

1. Go to your domain in Cloudflare Dashboard
2. Navigate to Workers Routes
3. Add a new route:
   - Route: `yourdomain.com/pdf/*`
   - Worker: `coloring-pages-pdf-proxy`

### 6. Upload PDF Mappings

After running the main build script, upload the mappings:
```bash
npm run upload-mappings
```

## How It Works

1. User visits `/pdf/robot-coloring-page.pdf`
2. Worker looks up the slug in KV store
3. Fetches the PDF from Sanity CDN
4. Serves it with `Content-Disposition: inline` (opens in browser)
5. Proper filename is preserved for downloads

## Benefits

- ✅ SEO-friendly URLs (`/pdf/nice-name.pdf`)
- ✅ Opens in browser for preview
- ✅ Proper filename when downloaded
- ✅ Cached at Cloudflare edge
- ✅ Google can crawl and index PDFs

## Testing

Test locally:
```bash
npm run dev
```

View logs:
```bash
npm run tail
```

## Environment Variables

No environment variables needed - everything is handled through KV namespace bindings.
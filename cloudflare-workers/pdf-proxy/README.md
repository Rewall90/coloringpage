# PDF/Image Asset Proxy Worker

A Cloudflare Worker that serves PDFs and images with SEO-friendly URLs while using Cloudflare KV for efficient asset mapping lookups.

## Overview

This worker handles requests for assets (PDFs and images) by:
1. Extracting hierarchical slugs from URLs (e.g., `/category/post/filename.pdf`)
2. Looking up the corresponding Sanity CDN URL in Cloudflare KV
3. Serving the asset with optimized caching headers

## Setup

### 1. Install Dependencies
```bash
cd cloudflare-workers/pdf-proxy
npm install
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Configure KV Namespace
Ensure your `wrangler.toml` is configured with the correct KV namespace binding:

```toml
[[kv_namespaces]]
binding = "ASSET_MAPPINGS"
id = "8122081381114c80872c143ae13272fe"
```

### 4. Deploy the Worker
```bash
npm run deploy
```

### 5. Generate Asset Mappings
Run your build process to generate the `public/pdf-mappings.json` file with all asset mappings.

## 🚀 Smart Incremental Upload System

### Why Incremental Upload?
The upload script now uses **incremental uploads** to avoid hitting Cloudflare KV PUT limits:
- **Before**: ~3,000 PUT operations per upload (1,487 mappings × 2 namespaces)
- **After**: 40-100 PUT operations per daily upload (incremental only)
- **Savings**: 97% reduction in PUT operations

### Daily Upload Workflow

```bash
# Normal daily upload - only uploads new/changed mappings
npm run upload-mappings
```

**Expected behavior:**
- **First run**: Uploads all ~1,487 existing mappings (one-time setup)
- **Daily runs**: Only uploads your 40-100 new images
- **No changes**: Skips upload with a friendly message

### Upload Commands

```bash
# Preview what would be uploaded (without actually uploading)
npm run upload-mappings -- --dry-run

# Force a complete reupload of all mappings (emergency use only)
npm run upload-mappings -- --force

# Normal incremental upload (recommended)
npm run upload-mappings
```

### Example Output

```bash
🚀 Starting incremental KV upload...
📦 Found 1487 total asset mappings
📋 Loaded previous upload state
🔄 42 mappings to upload (incremental)
⬆️  Uploading 42 mappings to production namespace...
✅ Successfully uploaded 42 mappings!
💾 Saved upload state for next incremental run
✅ Incremental upload complete! 42 mappings uploaded to KV.
```

## KV Limit Management

### Free Tier Limits
- **1,000 PUT operations per day**
- **100,000 read operations per day**

### How Incremental Upload Works
1. **State Tracking**: Creates `.last-upload-state.json` to track previously uploaded mappings
2. **Change Detection**: Compares current mappings against previous state
3. **Delta Upload**: Only uploads mappings that are new or changed
4. **Single Namespace**: Uploads only to the active production namespace

### Daily Usage Estimates
- **First upload**: 1,487 PUT operations (one-time)
- **Daily new content**: 40-100 PUT operations
- **No changes**: 0 PUT operations
- **Weekly average**: ~350 PUT operations (well under 1,000 daily limit)

## Asset URL Format

### PDFs
- **Input URL**: `coloringvault.com/pdf/cartoons-coloring-pages/bluey/bandit-gardening.pdf`
- **Extracted slug**: `cartoons-coloring-pages/bluey/bandit-gardening`
- **KV lookup**: Returns Sanity CDN URL
- **Response**: PDF served with `Content-Disposition: inline`

### Images
- **Input URL**: `coloringvault.com/category/image-name.webp`
- **Extracted slug**: `category/image-name`
- **KV lookup**: Returns Sanity CDN URL
- **Response**: Image served with optimized caching headers

## Development

### Local Development
```bash
npm run dev
```

### Deploy to Production
```bash
npm run deploy
```

### Monitor Logs
```bash
npm run tail
```

## Troubleshooting

### "Mappings file not found" Error
Ensure you've run your build process to generate `../../public/pdf-mappings.json`:
```bash
# Run from your project root
npm run build  # or whatever command generates your mappings
```

### KV PUT Limit Exceeded
If you hit the 1,000 daily limit:
1. **Wait**: Limits reset at midnight UTC
2. **Check**: Run with `--dry-run` to see what would upload
3. **Upgrade**: Consider Cloudflare Workers Paid plan ($5/month for 1M PUT operations)

### Force Full Reupload
Only use when necessary (corrupted KV state, major restructuring):
```bash
npm run upload-mappings -- --force
```

### Reset Upload State
Delete the state file to start fresh:
```bash
rm .last-upload-state.json
```

## File Structure

```
pdf-proxy/
├── src/
│   ├── index.js               # Main worker code
│   └── mappings.js            # Mapping utilities (if any)
├── upload-mappings.js         # Smart incremental upload script
├── wrangler.toml              # Cloudflare Worker configuration
├── package.json               # Dependencies and scripts
├── .last-upload-state.json    # Upload state (auto-generated)
└── README.md                  # This file
```

## Performance Features

- **Cloudflare Cache**: 7 days for images, 1 day for PDFs
- **Immutable Caching**: `max-age=31536000` with proper cache keys
- **CORS Support**: Cross-origin requests allowed
- **SEO Friendly**: Proper content headers and robots meta
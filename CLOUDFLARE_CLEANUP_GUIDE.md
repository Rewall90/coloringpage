# Cloudflare Worker Cleanup Guide

This guide provides step-by-step instructions for safely removing the old Cloudflare Worker image system while preserving PDF functionality.

## ⚠️ IMPORTANT: Pre-Cleanup Checklist

Before starting the cleanup, ensure:

1. **✅ Local image system is working** - Test homepage and content pages
2. **✅ All images are downloaded** - Run `npm run debug:images` to verify
3. **✅ Site is functioning** - Test `http://localhost:52088/` thoroughly
4. **✅ PDF downloads still work** - PDFs should continue using Cloudflare Workers

## 🎯 What Will Be Removed vs Preserved

### ❌ TO BE REMOVED (Image-related):
- Image proxy Cloudflare Worker
- Image KV mappings 
- Image-related build scripts
- Old template code generating Cloudflare URLs

### ✅ TO BE PRESERVED (PDF-related):
- PDF proxy Cloudflare Worker
- PDF KV mappings
- PDF download functionality
- PDF-related build scripts

---

## 📋 Step-by-Step Cleanup Process

### Step 1: Remove Image Proxy Cloudflare Worker

```bash
# Navigate to image proxy directory
cd cloudflare-workers/image-proxy

# Delete the image proxy worker from Cloudflare
wrangler delete

# Clean up the local directory
cd ../..
rm -rf cloudflare-workers/image-proxy
```

### Step 2: Clean Up Build Scripts

#### A. Update main build script
**File: `scripts/fetch-sanity-content-sections.js`**

Remove image mapping generation around line 337-340:
```javascript
// REMOVE these lines:
// Generate collection image mappings (real-time transformations)
if (post.heroImageUrl && post.categorySlug) {
  const baseSlug = `${post.categorySlug}/${safeFilename}`;
  assetMappings[baseSlug.toLowerCase()] = post.heroImageUrl;
}
```

#### B. Update asset mappings function
**File: `scripts/fetch-sanity-content-sections.js`**

Update `saveAssetMappings()` function around line 374-400:
```javascript
// Update this function to only save PDF mappings
const saveAssetMappings = () => {
  // Filter to only include PDF mappings (URLs containing '/files/')
  const pdfOnlyMappings = {};
  Object.entries(assetMappings).forEach(([key, url]) => {
    if (url.includes('/files/')) {
      pdfOnlyMappings[key] = url;
    }
  });

  if (Object.keys(pdfOnlyMappings).length === 0) {
    console.log('📄 No PDF mappings to save');
    return;
  }

  const mappingsPath = './public/pdf-mappings.json';
  
  // Ensure public directory exists
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }

  fs.writeFileSync(mappingsPath, JSON.stringify(pdfOnlyMappings, null, 2));
  
  const pdfCount = Object.keys(pdfOnlyMappings).length;
  console.log(`📄 Saved ${pdfCount} PDF mappings to ${mappingsPath}`);
};
```

#### C. Update shortcode parsing
**File: `scripts/fetch-sanity-content-sections.js`**

Remove or comment out the shortcode image parsing around line 354-364:
```javascript
// REMOVE OR COMMENT OUT these lines:
// Parse shortcodes in the content to extract individual image mappings
// const shortcodeRegex = /{{<\s*coloring-page-embed[\s\S]*?title="([^"]+)"[\s\S]*?image="([^"]+)"[\s\S]*?>}}/g;
// let shortcodeMatch;
// while ((shortcodeMatch = shortcodeRegex.exec(fullContent)) !== null) {
//   const shortcodeTitle = shortcodeMatch[1];
//   const shortcodeImageUrl = shortcodeMatch[2];
//   const shortcodeSlug = generateSafeFilename(null, shortcodeTitle, '', new Set());
//   const imageKey = `collections/${post.categorySlug}/${safeFilename}/${shortcodeSlug}`;
//   assetMappings[imageKey.toLowerCase()] = shortcodeImageUrl;
// }
```

### Step 3: Clean Up Package.json Scripts

**File: `package.json`**

Remove image-related test scripts:
```json
{
  "scripts": {
    // REMOVE these lines:
    // "test:images": "node scripts/test-image-download.js",
    // "debug:images": "node scripts/debug-images.js"
  }
}
```

### Step 4: Remove Development/Debug Scripts

```bash
# Remove image testing scripts (optional - can keep for maintenance)
rm scripts/test-image-download.js
rm scripts/debug-images.js
```

### Step 5: Clean Up KV Store

#### A. List current KV entries
```bash
cd cloudflare-workers/pdf-proxy
wrangler kv:key list --binding=ASSET_MAPPINGS --remote
```

#### B. Remove image mappings (keep PDF mappings)
```bash
# Remove specific image mapping keys (example - adjust as needed)
# Only remove keys that are image URLs (contain '/images/' in Sanity URLs)

# Example of removing image mappings:
wrangler kv:key delete "collections/animals/farm-animals-collection/carpenter-workshop" --binding=ASSET_MAPPINGS --remote
wrangler kv:key delete "collections/mythical-creatures/robot-coloring-page/teddy-bear-at-the-beach" --binding=ASSET_MAPPINGS --remote

# Keep PDF mappings like:
# "mythical-creatures/robot-coloring-page/teddy-bear-at-the-beach" -> PDF URL ✅ KEEP
```

### Step 6: Update Documentation

#### A. Update README.md
Remove sections about:
- Image proxy worker setup
- Image KV mappings
- Cloudflare image transformations

Keep sections about:
- PDF proxy worker
- PDF mappings
- PDF download functionality

#### B. Update build commands documentation
```markdown
## Updated Build Commands

### Production Build
```bash
npm run build
```
- Fetches content from Sanity
- Downloads images locally to `/static/images/`
- Generates PDF mappings for Cloudflare Workers
- Builds Hugo site

### Development
```bash
npm run dev
```
- Same as build but starts Hugo dev server
```

### Step 7: Environment Variables Cleanup

No changes needed - environment variables are shared between image and PDF workers.

### Step 8: Verify PDF Functionality

After cleanup, test that PDFs still work:

1. **Test PDF download links** on content pages
2. **Verify PDF proxy worker** is still running
3. **Check PDF mappings** are generated correctly

```bash
# Test PDF proxy
curl -I https://your-domain.com/mythical-creatures/robot-coloring-page/teddy-bear-at-the-beach.pdf

# Should return 200 OK with PDF content-type
```

---

## 🧹 Optional Deep Cleanup

### Remove Unused Utility Functions

**File: `scripts/utils/image-processor.js`**
- Can remove `transformShortcodesToLocal` function (now returns content as-is)
- Keep `processAllImages` for local image downloading

**File: `scripts/utils/portable-text-helpers.js`**
- The fallback Sanity CDN URL generation can be removed since we always have page context

### Remove Cloudflare Worker Directory Structure

```bash
# Remove the entire image proxy worker directory
rm -rf cloudflare-workers/image-proxy

# Keep the PDF proxy worker
# cloudflare-workers/pdf-proxy/ ← KEEP THIS
```

---

## ✅ Post-Cleanup Verification

### 1. Test Image Loading
- ✅ Homepage category images load from `/images/categories/`
- ✅ Content page images load from `/images/collections/`
- ✅ No broken image links

### 2. Test PDF Downloads
- ✅ PDF download buttons work
- ✅ PDFs open in browser via Cloudflare Worker
- ✅ PDF proxy worker responds correctly

### 3. Test Build Process
```bash
# Clean build test
npm run clean
npm run build

# Verify output
ls static/images/  # Should show downloaded images
ls public/         # Should show pdf-mappings.json
```

### 4. Performance Check
- ✅ Faster image loading (no Cloudflare Worker latency)
- ✅ Same PDF performance (still using optimized worker)
- ✅ Simpler build process

---

## 🚨 Rollback Plan

If issues arise, you can temporarily restore image workers:

1. **Restore image proxy worker**:
   ```bash
   git checkout HEAD -- cloudflare-workers/image-proxy/
   cd cloudflare-workers/image-proxy
   wrangler deploy
   ```

2. **Restore old templates**:
   ```bash
   git checkout HEAD -- layouts/shortcodes/coloring-page-embed.html
   git checkout HEAD -- layouts/partials/category-card.html
   git checkout HEAD -- layouts/partials/article-link/card.html
   ```

3. **Restore build scripts**:
   ```bash
   git checkout HEAD -- scripts/fetch-sanity-content-sections.js
   ```

---

## 📊 Benefits After Cleanup

### ✅ Simplified Architecture
- **Before**: Hugo + Sanity + Cloudflare Workers (Images) + Cloudflare Workers (PDFs)
- **After**: Hugo + Sanity + Local Images + Cloudflare Workers (PDFs only)

### ✅ Reduced Complexity
- 50% fewer Cloudflare Workers to maintain
- No image KV mappings to sync
- Simpler debugging (actual image files)

### ✅ Improved Reliability
- Images served from same domain
- No external image dependencies
- Faster initial page loads

### ✅ Maintained PDF Benefits
- PDFs still benefit from Cloudflare Workers
- SEO-friendly PDF URLs preserved
- Optimized PDF delivery maintained

---

## 🎯 Final Notes

1. **PDF functionality is preserved** - Only image handling is changed
2. **URLs remain the same** - No breaking changes for users
3. **Performance improved** - Local images load faster
4. **Maintenance reduced** - Fewer moving parts to manage

This cleanup removes unnecessary complexity while maintaining all user-facing functionality and preserving the benefits of Cloudflare Workers for PDF delivery.
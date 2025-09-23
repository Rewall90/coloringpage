# Low-Compute Content Workflow

Optimized workflow for fetching content and managing Cloudflare KV with minimal resource usage.

## 🚀 Quick Start (New Content)

**One-liner for new content:**

```bash
npm run fetch-content-sections && cd cloudflare-workers/pdf-proxy && npm run upload-mappings && cd ../.. && echo "✅ Content ready for commit"
```

## 📊 Efficiency Overview

| Operation      | Compute Impact | Frequency        | Optimization                     |
| -------------- | -------------- | ---------------- | -------------------------------- |
| Content fetch  | Medium         | On new content   | Smart caching, image skip        |
| KV upload      | Low            | Incremental only | 97% reduction via state tracking |
| Git operations | Low            | As needed        | Automated batching               |

## 🎯 Optimized Workflows

### A. New Content (Recommended)

```bash
# Check what's new first (low cost)
npm run upload-mappings -- --dry-run

# Full pipeline (only if needed)
npm run fetch-content-sections
cd cloudflare-workers/pdf-proxy && npm run upload-mappings && cd ../..
```

### B. Content Verification (Zero cost)

```bash
# Check if content exists
grep "squirrel-coloring-page" public/pdf-mappings.json

# Check KV status
cd cloudflare-workers/pdf-proxy && npm run upload-mappings -- --dry-run
```

### C. Emergency Re-sync (High cost - avoid)

```bash
# Only use if system is broken
cd cloudflare-workers/pdf-proxy && npm run upload-mappings -- --force
```

## 💡 Smart Optimizations

### Image Processing Efficiency

- **Smart Skipping**: `⏭️ Skipping (up to date)` - No re-download if unchanged
- **Concurrent Downloads**: Max 3 simultaneous (respects rate limits)
- **Local Caching**: Images stored in `/static/images/collections/`

### KV Upload Efficiency

- **Incremental Only**: 40-100 PUT ops vs 1,290 (97% reduction)
- **State Tracking**: `.last-upload-state.json` remembers what's uploaded
- **Safe Re-runs**: Zero cost if no changes detected

### Build Optimization

```bash
# Fast: Only new content (recommended)
npm run fetch-content-sections

# Slower: Full rebuild (only when needed)
npm run build

# Fastest: Verification only
npm run upload-mappings -- --dry-run
```

## 🔧 Command Reference

| Command                                | Cost   | Use Case         | Output                |
| -------------------------------------- | ------ | ---------------- | --------------------- |
| `npm run fetch-content-sections`       | Medium | New content      | Downloads + processes |
| `npm run upload-mappings`              | Low    | Incremental sync | 0-100 uploads         |
| `npm run upload-mappings -- --dry-run` | Zero   | Check status     | Preview only          |
| `npm run upload-mappings -- --force`   | High   | Emergency        | 1,290 uploads         |

## ⚡ Performance Metrics

### Resource Usage

```
Content Fetch: ~30-60 seconds (1,373 images processed)
KV Upload: ~5-10 seconds (incremental)
Git Operations: ~2-5 seconds
Total: ~40-75 seconds for new content
```

### Daily Limits (Cloudflare Free)

- **PUT Operations**: 1,000/day
- **Typical Usage**: 40-100/day (new content)
- **Emergency Full**: 1,290 (avoid unless broken)

## 🔍 Diagnostic Commands

### Check System Status (Zero Cost)

```bash
# 1. Verify content exists
ls content/animals-coloring-pages/squirrel-coloring-page.md

# 2. Check PDF mappings
grep -c "squirrel-coloring-page" public/pdf-mappings.json

# 3. Preview KV changes
cd cloudflare-workers/pdf-proxy && npm run upload-mappings -- --dry-run
```

### Debug Workflow Issues

```bash
# Content missing? Check fetch
npm run fetch-content-sections | grep "squirrel"

# PDFs not working? Check KV
cd cloudflare-workers/pdf-proxy && npm run upload-mappings

# Still broken? Check environment
cat .env.local | grep SANITY
```

## 🚨 Troubleshooting

| Issue                 | Quick Fix                      | Cost |
| --------------------- | ------------------------------ | ---- |
| "No changes detected" | ✅ Normal - all up to date     | Zero |
| Content not fetching  | Check `.env.local` credentials | Zero |
| PDFs not working      | Run `npm run upload-mappings`  | Low  |
| KV upload fails       | `wrangler login`               | Zero |

## 🎛️ Advanced Operations (High Cost)

### Selective Content Re-upload

**Cost: 50-100 PUT operations**

```bash
# Template for specific content refresh
PAGE="nature-coloring-pages/sun-coloring-page"
cd cloudflare-workers/pdf-proxy

# Delete + re-upload in one script
grep "$PAGE" ../../public/pdf-mappings.json | cut -d'"' -f2 | \
while read key; do wrangler kv key delete "$key" --namespace-id=8122081381114c80872c143ae13272fe; done && \
npm run upload-mappings
```

### Emergency Full Reset

**Cost: 1,290 PUT operations (AVOID)**

```bash
cd cloudflare-workers/pdf-proxy && rm .last-upload-state.json && npm run upload-mappings -- --force
```

## 📋 Decision Tree

```
New Content Added?
├─ Yes → npm run fetch-content-sections (Medium cost)
│  └─ npm run upload-mappings (Low cost)
└─ No → npm run upload-mappings -- --dry-run (Zero cost)
   ├─ "No changes" → ✅ All good
   └─ Changes found → npm run upload-mappings (Low cost)

PDF Not Working?
├─ Check mappings exist → grep "page-name" public/pdf-mappings.json
├─ Upload to KV → npm run upload-mappings
└─ Still broken → Advanced re-upload (High cost)
```

## 📈 Efficiency Guidelines

### ✅ Do (Low Cost)

- Use `--dry-run` to check status first
- Run incremental uploads regularly
- Verify before re-running expensive operations

### ⚠️ Caution (Medium Cost)

- Content fetching (only when needed)
- Full rebuilds with `npm run build`

### ❌ Avoid (High Cost)

- `--force` uploads (emergency only)
- Deleting entire KV namespace
- Multiple full fetches per day

## 🔧 Environment Setup

**Required in `.env.local`:**

```bash
SANITY_PROJECT_ID=zjqmnotc
SANITY_DATASET=production
# SANITY_TOKEN=xxx (only if private)
```

## 📋 Quick Reference

| Task                | Command                                                                                        | Cost   |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| **New content**     | `npm run fetch-content-sections && cd cloudflare-workers/pdf-proxy && npm run upload-mappings` | Medium |
| **Check status**    | `cd cloudflare-workers/pdf-proxy && npm run upload-mappings -- --dry-run`                      | Zero   |
| **Verify content**  | `grep "page-name" public/pdf-mappings.json`                                                    | Zero   |
| **Emergency reset** | `cd cloudflare-workers/pdf-proxy && npm run upload-mappings -- --force`                        | High   |

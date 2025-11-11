# Quick Setup Guide

## Content Update Process

**⚠️ IMPORTANT: Follow ALL steps every time you add new coloring pages to avoid 404 errors!**

### Step-by-Step Workflow

#### 1. Fetch Content from Sanity CMS

```bash
npm run fetch-content-sections
```

**What it does:** Fetches latest content from Sanity and updates markdown files in `content/` directory.

---

#### 2. Update PDF Mappings to Cloudflare KV

```bash
cd cloudflare-workers/pdf-proxy && npm run upload-mappings
```

**What it does:** Uploads PDF URL mappings as a **single JSON blob** to Cloudflare KV store (1 write operation instead of thousands).

**⚠️ CRITICAL:** Skipping this step causes PDF 404 errors! Every new coloring page has PDFs that need to be mapped.

**✅ Free Tier Optimized:** Uses only 1 KV write operation per update (free tier limit: 1,000/day).

---

#### 3. Deploy Cloudflare Worker (Optional)

```bash
npx wrangler deploy
```

**What it does:** Deploys the latest PDF proxy worker to Cloudflare.

**Note:** Only needed if you modified the worker code. PDF mappings auto-update without redeployment thanks to in-memory caching.

---

#### 4. Commit Changes to Git

```bash
cd ../..
git add .
git commit -m "Add [topic] coloring pages and deploy assets"
```

**What it does:** Commits the updated content files and pdf-mappings.json to git.

---

#### 5. Push to GitHub

```bash
git push origin main
```

**What it does:** Pushes changes to GitHub, which **automatically triggers Vercel deployment**.

**🤖 Automatic Process:** Vercel detects the push and automatically:

- Runs `npm run build` (fetches content + builds Hugo site)
- Deploys fresh `public/` directory to production
- Updates https://coloringvault.com within 1-2 minutes

---

## Verification Checklist

After completing all steps, verify:

- ✅ Cloudflare Worker deployed successfully
- ✅ Git commit shows in GitHub (https://github.com/Rewall90/coloringpage)
- ✅ Vercel deployment succeeded (check with `vercel ls`)
- ✅ New pages appear on production site within 2 minutes

---

## Common Issues

### Issue: PDF 404 Errors

**Cause:** Step 2 was skipped (KV mappings not uploaded)
**Fix:** Run `cd cloudflare-workers/pdf-proxy && npm run upload-mappings`

**Note:** Worker redeployment (Step 3) is NOT required for PDF mappings to update.

### Issue: New content not appearing on site

**Cause:** Git push failed or Vercel deployment issue
**Fix:** Check `vercel ls` for deployment status. Re-run `git push origin main` if needed.

### Issue: Local `public/` directory is stale

**Note:** This is normal! Your local `public/` directory is gitignored. Only production matters.
**To rebuild locally:** `npm run clean && npm run build`

---

## Quick Command (Copy-Paste)

```bash
npm run fetch-content-sections && \
cd cloudflare-workers/pdf-proxy && \
npm run upload-mappings && \
cd ../.. && \
git add . && \
git commit -m "Add new coloring pages and deploy assets" && \
git push origin main
```

**Note:** `npx wrangler deploy` omitted - only needed if worker code changes. Mappings auto-update via cached KV blob.

---

## Architecture Overview

```
Content Flow:
┌─────────────────┐
│  Sanity CMS     │ (Content source)
└────────┬────────┘
         │ Step 1: fetch-content-sections
         ↓
┌─────────────────┐
│  content/*.md   │ (Hugo content files)
│  pdf-mappings   │ (699 KB JSON - 3,914 mappings)
└────────┬────────┘
         │ Step 2: upload-mappings (1 KV write!)
         ↓
┌─────────────────┐
│ Cloudflare KV   │ (Single blob: "pdf-mappings")
│ CF Worker       │ (Cached in-memory for fast lookups)
└─────────────────┘
         │ Step 3-5: git commit + push
         ↓
┌─────────────────┐
│    GitHub       │ (Source control)
└────────┬────────┘
         │ Webhook triggers Vercel
         ↓
┌─────────────────┐
│ Vercel Build    │ (Runs: npm run build)
│ Hugo Generator  │ (Creates: public/)
└────────┬────────┘
         │ Deploys to production
         ↓
┌─────────────────┐
│ coloringvault   │ ✅ LIVE SITE
└─────────────────┘

Performance:
• Worker caches mappings in-memory (1-hour TTL)
• 1 KV write per update (free tier: 1,000/day)
• ~0 KV reads per request (cached globally)
• Stays within Cloudflare free tier forever
```

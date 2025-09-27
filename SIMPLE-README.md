# Quick Setup Guide

## Content Update Process

1. `npm run fetch-content-sections`
2. `cd cloudflare-workers/pdf-proxy && npm run upload-mappings`
3. `npx wrangler deploy`
4. `cd ../.. && git add .`
5. `git commit -m "your commit message"`
6. `git push origin main`

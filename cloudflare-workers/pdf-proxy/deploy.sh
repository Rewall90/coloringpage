#!/bin/bash

echo "🚀 Deploying PDF Proxy Worker to Cloudflare..."

# Login to Cloudflare (if not already logged in)
echo "📝 Checking Cloudflare authentication..."
wrangler whoami || wrangler login

# Create KV namespace if it doesn't exist
echo "📦 Creating KV namespace..."
wrangler kv:namespace create "PDF_MAPPINGS" || true

# Get the namespace ID from the output and update wrangler.toml
echo "⚠️  Remember to update the KV namespace ID in wrangler.toml!"

# Deploy the Worker
echo "🔧 Deploying Worker..."
wrangler publish

echo "✅ Worker deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update the KV namespace ID in wrangler.toml"
echo "2. Configure the route in Cloudflare dashboard"
echo "3. Upload PDF mappings using: npm run upload-mappings"
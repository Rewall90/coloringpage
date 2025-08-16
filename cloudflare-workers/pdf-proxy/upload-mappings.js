#!/usr/bin/env node

/**
 * Upload asset mappings (PDFs and images) to Cloudflare KV
 * Run this after your build process generates the mappings
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Read mappings from the generated file (will be created by build script)
const MAPPINGS_FILE = path.join(process.cwd(), '../../public/pdf-mappings.json');

// Check if mappings file exists
if (!fs.existsSync(MAPPINGS_FILE)) {
  console.error('❌ Mappings file not found at:', MAPPINGS_FILE);
  console.log('Run the build script first to generate PDF mappings.');
  process.exit(1);
}

// Read the mappings
const mappings = JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf-8'));

console.log(`📦 Found ${Object.keys(mappings).length} asset mappings to upload...`);

// Upload each mapping to KV
for (const [slug, url] of Object.entries(mappings)) {
  try {
    console.log(`⬆️  Uploading: ${slug}`);
    execSync(
      `wrangler kv key put "${slug}" "${url}" --binding=ASSET_MAPPINGS --remote`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error(`❌ Failed to upload ${slug}:`, error.message);
  }
}

console.log('✅ All mappings uploaded successfully!');
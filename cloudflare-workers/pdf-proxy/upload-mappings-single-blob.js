#!/usr/bin/env node

/**
 * Upload PDF mappings as a single JSON blob to Cloudflare KV
 * This dramatically reduces KV write operations (1 instead of 3,914)
 * and stays within the free tier limit of 1,000 writes/day
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const MAPPINGS_FILE = path.join(process.cwd(), '../../public/pdf-mappings.json');
const NAMESPACE_ID = '8122081381114c80872c143ae13272fe';

console.log('🚀 Starting single-blob KV upload...');

// Check if mappings file exists
if (!fs.existsSync(MAPPINGS_FILE)) {
  console.error('❌ Mappings file not found at:', MAPPINGS_FILE);
  console.log('Run the build script first to generate PDF mappings.');
  process.exit(1);
}

// Read and validate mappings
let mappings;
try {
  const mappingsContent = fs.readFileSync(MAPPINGS_FILE, 'utf-8');
  mappings = JSON.parse(mappingsContent);
  const entryCount = Object.keys(mappings).length;
  const sizeKB = (mappingsContent.length / 1024).toFixed(2);

  console.log(`📦 Found ${entryCount} PDF mappings (${sizeKB} KB)`);

  // Validate size (KV max is 25 MB)
  const sizeMB = mappingsContent.length / (1024 * 1024);
  if (sizeMB > 25) {
    console.error(`❌ Mappings file is too large: ${sizeMB.toFixed(2)} MB (max 25 MB)`);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Failed to read or parse mappings file:', error.message);
  process.exit(1);
}

// Upload to KV as single blob
try {
  console.log('⬆️  Uploading single JSON blob to KV namespace:', NAMESPACE_ID);
  console.log('    Key: pdf-mappings');

  execFileSync('npx', [
    'wrangler', 'kv', 'key', 'put',
    'pdf-mappings',
    '--namespace-id', NAMESPACE_ID,
    '--path', MAPPINGS_FILE
  ], {
    stdio: 'inherit',
    shell: true // Needed for Windows
  });

  console.log('✅ Successfully uploaded PDF mappings as single blob!');
  console.log('');
  console.log('📊 Stats:');
  console.log(`   - KV writes used: 1 (instead of ${Object.keys(mappings).length})`);
  console.log(`   - Free tier remaining: 999/1000 writes`);
  console.log(`   - Storage used: ${(JSON.stringify(mappings).length / 1024).toFixed(2)} KB`);

} catch (error) {
  console.error('❌ Failed to upload mappings:', error.message);
  process.exit(1);
}

console.log('');
console.log('✨ Done! The worker will now use cached in-memory lookups.');

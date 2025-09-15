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

// Convert to bulk upload format
const bulkMappings = Object.entries(mappings).map(([key, value]) => ({ key, value }));
const bulkFile = 'bulk-mappings.json';

// Write bulk mappings file
fs.writeFileSync(bulkFile, JSON.stringify(bulkMappings, null, 2));

console.log(`💾 Created bulk upload file: ${bulkFile}`);

// Upload all mappings to both namespaces
const namespaces = [
  { id: '8122081381114c80872c143ae13272fe', name: 'new worker namespace' },
  { id: '0bfbc7de488a4fcfa3457efbcfd130e1', name: 'old worker namespace' }
];

for (const namespace of namespaces) {
  try {
    console.log(`⬆️  Uploading ${bulkMappings.length} mappings to ${namespace.name}...`);
    execSync(
      `wrangler kv bulk put ${bulkFile} --namespace-id=${namespace.id}`,
      { stdio: 'inherit' }
    );
    console.log(`✅ Successfully uploaded to ${namespace.name}`);
  } catch (error) {
    console.error(`❌ Failed to upload to ${namespace.name}:`, error.message);
  }
}

// Clean up bulk file
fs.unlinkSync(bulkFile);

console.log('✅ All mappings uploaded successfully!');
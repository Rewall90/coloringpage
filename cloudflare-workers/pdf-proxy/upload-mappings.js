#!/usr/bin/env node

/**
 * Incremental upload of asset mappings (PDFs and images) to Cloudflare KV
 * Only uploads new/changed mappings to avoid KV PUT limits
 * Run this after your build process generates the mappings
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Configuration
const MAPPINGS_FILE = path.join(process.cwd(), '../../public/pdf-mappings.json');
const LAST_UPLOAD_FILE = path.join(process.cwd(), '.last-upload-state.json');
const ACTIVE_NAMESPACE = {
  id: '8122081381114c80872c143ae13272fe',
  name: 'production namespace'
};

// Command line flags
const forceFullUpload = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

console.log('🚀 Starting incremental KV upload...');

// Check if mappings file exists
if (!fs.existsSync(MAPPINGS_FILE)) {
  console.error('❌ Mappings file not found at:', MAPPINGS_FILE);
  console.log('Run the build script first to generate PDF mappings.');
  process.exit(1);
}

// Read current mappings
const currentMappings = JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf-8'));
console.log(`📦 Found ${Object.keys(currentMappings).length} total asset mappings`);

// Load previous upload state
let previousState = {};
let changedMappings = {};
let isFirstUpload = false;

if (fs.existsSync(LAST_UPLOAD_FILE) && !forceFullUpload) {
  try {
    previousState = JSON.parse(fs.readFileSync(LAST_UPLOAD_FILE, 'utf-8'));
    console.log('📋 Loaded previous upload state');

    // Find only changed/new mappings
    for (const [key, value] of Object.entries(currentMappings)) {
      if (!previousState.mappings || previousState.mappings[key] !== value) {
        changedMappings[key] = value;
      }
    }

    // Find deleted mappings (optional: could implement deletion)
    const deletedKeys = previousState.mappings
      ? Object.keys(previousState.mappings).filter(key => !(key in currentMappings))
      : [];

    if (deletedKeys.length > 0) {
      console.log(`🗑️  ${deletedKeys.length} mappings were deleted (not removing from KV)`);
    }

  } catch (error) {
    console.warn('⚠️  Could not load previous state, doing full upload');
    changedMappings = currentMappings;
    isFirstUpload = true;
  }
} else {
  console.log(forceFullUpload ? '🔄 Force full upload requested' : '📋 No previous state found');
  changedMappings = currentMappings;
  isFirstUpload = true;
}

const changeCount = Object.keys(changedMappings).length;

if (changeCount === 0) {
  console.log('✨ No changes detected! All mappings are up to date.');
  process.exit(0);
}

console.log(`🔄 ${changeCount} mappings to upload (${isFirstUpload ? 'initial upload' : 'incremental'})`);

if (dryRun) {
  console.log('🧪 DRY RUN - Would upload these mappings:');
  Object.keys(changedMappings).slice(0, 10).forEach(key => {
    console.log(`  - ${key}`);
  });
  if (changeCount > 10) {
    console.log(`  ... and ${changeCount - 10} more`);
  }
  process.exit(0);
}

// Convert to bulk upload format
const bulkMappings = Object.entries(changedMappings).map(([key, value]) => ({ key, value }));
const bulkFile = `incremental-mappings-${Date.now()}.json`;

// Write bulk mappings file
fs.writeFileSync(bulkFile, JSON.stringify(bulkMappings, null, 2));
console.log(`💾 Created incremental upload file: ${bulkFile}`);

// Upload only to active namespace (not both)
try {
  console.log(`⬆️  Uploading ${bulkMappings.length} mappings to ${ACTIVE_NAMESPACE.name}...`);
  execSync(
    `wrangler kv bulk put ${bulkFile} --namespace-id=${ACTIVE_NAMESPACE.id}`,
    { stdio: 'inherit' }
  );
  console.log(`✅ Successfully uploaded ${changeCount} mappings!`);

  // Save current state for next incremental upload
  const newState = {
    lastUpload: new Date().toISOString(),
    mappingsCount: Object.keys(currentMappings).length,
    uploadedCount: changeCount,
    mappings: currentMappings
  };

  fs.writeFileSync(LAST_UPLOAD_FILE, JSON.stringify(newState, null, 2));
  console.log('💾 Saved upload state for next incremental run');

} catch (error) {
  console.error(`❌ Failed to upload mappings:`, error.message);
  process.exit(1);
} finally {
  // Clean up bulk file
  if (fs.existsSync(bulkFile)) {
    fs.unlinkSync(bulkFile);
  }
}

console.log(`✅ Incremental upload complete! ${changeCount} mappings uploaded to KV.`);
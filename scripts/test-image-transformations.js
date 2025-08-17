#!/usr/bin/env node

/**
 * Test Script for Real-Time Image Transformations
 *
 * This script validates that the enhanced Cloudflare Worker is functioning
 * correctly and providing proper image transformations.
 *
 * Usage:
 *   node scripts/test-image-transformations.js
 *   npm run test:images
 */

import https from 'https';
import { URL } from 'url';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://coloringvault.com';
const TIMEOUT_MS = 10000; // 10 seconds

// Test cases
const TEST_CASES = [
  {
    name: 'Legacy 4-size URL (backward compatibility)',
    url: '/collections/animals/farm-animals-collection/thumbnail-300.webp',
    expectedStatus: 200,
    expectedContentType: 'image/webp',
    description: 'Should work with existing KV mappings',
  },
  {
    name: 'Real-time transformation - 300x400',
    url: '/collections/animals/farm-animals-collection.webp?w=300&h=400&q=75&fit=cover&format=auto',
    expectedStatus: 200,
    expectedContentType: 'image/webp',
    description: 'Should transform image in real-time',
  },
  {
    name: 'Real-time transformation - 200x267',
    url: '/collections/animals/farm-animals-collection.webp?w=200&h=267&q=75&fit=cover&format=auto',
    expectedStatus: 200,
    expectedContentType: 'image/webp',
    description: 'Should generate mobile-sized image',
  },
  {
    name: 'Real-time transformation - 768x1024',
    url: '/collections/animals/farm-animals-collection.webp?w=768&h=1024&q=85&fit=cover&format=auto',
    expectedStatus: 200,
    expectedContentType: 'image/webp',
    description: 'Should generate tablet-sized image',
  },
  {
    name: 'Real-time transformation - custom size',
    url: '/collections/animals/farm-animals-collection.webp?w=500&h=667&q=90&fit=cover&format=webp',
    expectedStatus: 200,
    expectedContentType: 'image/webp',
    description: 'Should handle custom dimensions',
  },
  {
    name: 'Invalid collection path',
    url: '/collections/invalid/nonexistent.webp?w=300&h=400',
    expectedStatus: 404,
    expectedContentType: 'text/plain',
    description: 'Should return 404 for missing images',
  },
  {
    name: 'Non-image request',
    url: '/collections/animals/farm-animals-collection.html',
    expectedStatus: 200,
    expectedContentType: 'text/html',
    description: 'Should pass through non-image requests',
  },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
const log = {
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  test: msg => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
};

/**
 * Make HTTP request and return response details
 */
async function makeRequest(url) {
  const http = await import('http');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD', // Use HEAD to avoid downloading full image
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'ColoringVault-Test-Script/1.0',
      },
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http.default;

    const req = protocol.request(options, res => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        contentType: res.headers['content-type'] || '',
        transformApplied: res.headers['x-transform-applied'] === 'true',
        mappingType: res.headers['x-mapping-type'] || 'unknown',
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Run a single test case
 */
async function runTest(testCase) {
  const fullUrl = `${BASE_URL}${testCase.url}`;

  log.test(`Testing: ${testCase.name}`);
  console.log(`  URL: ${testCase.url}`);
  console.log(`  Expected: ${testCase.expectedStatus} ${testCase.expectedContentType}`);

  try {
    const response = await makeRequest(fullUrl);

    // Check status code
    const statusOk = response.status === testCase.expectedStatus;
    const contentTypeOk = response.contentType.includes(testCase.expectedContentType);

    if (statusOk && contentTypeOk) {
      log.success(`PASS - ${testCase.description}`);

      // Log additional info for successful image requests
      if (response.status === 200 && response.contentType.includes('image/')) {
        console.log(`    Transform: ${response.transformApplied ? 'Real-time' : 'Pre-built'}`);
        console.log(`    Mapping: ${response.mappingType}`);
        console.log(`    Content-Type: ${response.contentType}`);
      }

      return { passed: true, testCase, response };
    } else {
      log.error(`FAIL - ${testCase.description}`);
      console.log(`    Expected: ${testCase.expectedStatus} ${testCase.expectedContentType}`);
      console.log(`    Got: ${response.status} ${response.contentType}`);

      return { passed: false, testCase, response };
    }
  } catch (error) {
    log.error(`ERROR - ${testCase.description}`);
    console.log(`    Error: ${error.message}`);

    return { passed: false, testCase, error };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`\n${colors.magenta}🚀 Starting Image Transformation Tests${colors.reset}`);
  console.log(`Target: ${BASE_URL}\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }

    console.log(''); // Empty line between tests
  }

  // Summary
  console.log(`${colors.magenta}📊 Test Results Summary${colors.reset}`);
  console.log(`Total tests: ${TEST_CASES.length}`);
  log.success(`Passed: ${passed}`);

  if (failed > 0) {
    log.error(`Failed: ${failed}`);

    console.log('\n🔍 Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`  ❌ ${result.testCase.name}`);
        console.log(`     ${result.testCase.url}`);
        if (result.error) {
          console.log(`     Error: ${result.error.message}`);
        }
      });
  }

  console.log('');

  if (failed === 0) {
    log.success('🎉 All tests passed! Real-time transformations are working correctly.');

    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Worker is functioning properly');
    console.log('2. ✅ Both legacy and real-time URLs work');
    console.log('3. 🔄 You can now enable real-time transforms in Hugo');
    console.log('4. 🔄 Set useRealTimeTransforms=true in config/params.toml');
    console.log('5. 🔄 Set USE_REAL_TIME_TRANSFORMS=true for builds');
  } else {
    log.error('❌ Some tests failed. Please check the worker deployment and KV mappings.');

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Cloudflare Worker logs: npx wrangler tail');
    console.log('2. Verify KV namespace is bound correctly');
    console.log('3. Confirm asset mappings exist in KV store');
    console.log('4. Test worker routes in Cloudflare dashboard');

    process.exit(1);
  }
}

/**
 * Performance test for real-time transformations
 */
async function performanceTest() {
  log.info('Running performance test...');

  const testUrl = `${BASE_URL}/collections/animals/farm-animals-collection.webp?w=400&h=533&q=85&fit=cover&format=auto`;
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    try {
      await makeRequest(testUrl);
      const duration = Date.now() - start;
      times.push(duration);
      console.log(`  Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      log.warning(`Performance test ${i + 1} failed: ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`\n📈 Performance Results:`);
    console.log(`  Average: ${avgTime}ms`);
    console.log(`  Min: ${minTime}ms`);
    console.log(`  Max: ${maxTime}ms`);

    if (avgTime < 1000) {
      log.success('Performance is excellent! (< 1s)');
    } else if (avgTime < 2000) {
      log.warning('Performance is acceptable (1-2s)');
    } else {
      log.error('Performance is slow (> 2s) - check Cloudflare configuration');
    }
  }
}

// Main execution
async function main() {
  try {
    await runAllTests();
    await performanceTest();
  } catch (error) {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

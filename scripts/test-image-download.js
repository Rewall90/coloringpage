#!/usr/bin/env node

/**
 * Test Image Download System
 *
 * Standalone script to test the image download functionality
 * without running the full build process.
 */

import fs from 'fs';

import dotenv from 'dotenv';

import { validateEnvironment, createSanityClient, testConnection } from './utils/sanity-helpers.js';
import { processAllImages } from './utils/image-processor.js';

// Load environment variables - same pattern as main script
const envFiles = ['.env.local', '.env.production', '.env'];
let envLoaded = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    console.log(`📦 Loaded environment from: ${envFile}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('📦 No .env file found, using system environment variables');
}

async function testImageDownload() {
  console.log('🧪 Testing Image Download System\n');

  // Validate environment
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }

  // Create Sanity client
  const client = createSanityClient();

  // Test connection
  try {
    await testConnection(client);
  } catch (error) {
    console.error('❌ Sanity connection failed:', error.message);
    process.exit(1);
  }

  try {
    console.log('📡 Fetching sample data from Sanity...\n');

    // Fetch sample categories
    const categories = await client.fetch(`
      *[_type == "category"] | order(sortOrder asc, title asc) [0...3] {
        _id,
        title,
        "slug": slug.current,
        description,
        "categoryImageUrl": categoryImage.asset->url,
        "imageDimensions": categoryImage.asset->metadata.dimensions
      }
    `);

    // Fetch sample posts with coloring pages
    const posts = await client.fetch(`
      *[_type == "post"] | order(_createdAt desc) [0...2] {
        _id,
        title,
        "slug": slug.current,
        "categorySlug": category->slug.current,
        "categoryTitle": category->title,
        content[]{
          ...,
          _type == "coloringPage" => {
            _type,
            title,
            description,
            "imageUrl": image.asset->url,
            "pdfUrl": pdfFile.asset->url
          }
        },
        "heroImageUrl": heroImage.asset->url,
        "heroImageDimensions": heroImage.asset->metadata.dimensions,
        "heroImageAlt": heroImage.alt
      }
    `);
    
    console.log('📝 Sample post content:');
    posts.forEach(post => {
      console.log(`   Post: ${post.title}`);
      console.log(`   Content blocks: ${post.content?.length || 0}`);
      if (post.content) {
        const coloringPages = post.content.filter(block => block._type === 'coloringPage');
        console.log(`   Coloring page blocks: ${coloringPages.length}`);
        coloringPages.forEach(cp => {
          console.log(`     - ${cp.title}: ${cp.imageUrl ? 'has image' : 'no image'}`);
        });
      }
    });

    console.log(`📊 Sample Data Summary:`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Posts: ${posts.length}\n`);

    // Process images
    const result = await processAllImages(categories, posts);

    if (result.success) {
      console.log('✅ Image download test completed successfully!');

      if (result.summary.total > 0) {
        console.log(`\n📈 Final Summary:`);
        console.log(`   Total images: ${result.summary.total}`);
        console.log(`   Downloaded: ${result.summary.downloaded}`);
        console.log(`   Skipped: ${result.summary.skipped}`);
        console.log(`   Failed: ${result.summary.failed}`);
      }
    } else {
      console.log('⚠️  Image download test completed with errors');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testImageDownload();
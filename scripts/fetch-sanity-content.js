#!/usr/bin/env node

/**
 * Hugo + Sanity Content Generation Script
 *
 * This script fetches content from Sanity CMS and generates Hugo-compatible
 * markdown files with proper YAML frontmatter. It handles all content types:
 * posts, pages, categories, and coloring pages.
 *
 * Usage:
 *   node scripts/fetch-sanity-content.js
 *   npm run fetch-content
 *
 * Environment Variables Required:
 *   SANITY_PROJECT_ID - Your Sanity project ID
 *   SANITY_DATASET - Dataset name (usually 'production')
 *   SANITY_TOKEN - API token (optional, for private datasets)
 */

import fs from 'fs';
import path from 'path';

// Removed unused imports - createClient and yaml
import dotenv from 'dotenv';

// Import utility functions
import { validateEnvironment, createSanityClient, testConnection } from './utils/sanity-helpers.js';
import {
  generateMarkdown,
  cleanDirectory,
  generateSafeFilename,
  writeMarkdownFile,
} from './utils/file-helpers.js';
import { portableTextToMarkdown, portableTextToExcerpt } from './utils/portable-text-helpers.js';
import {
  getColoringPageImages,
  getCategoryImages,
  getPostImages,
  getImageDimensions,
  IMAGE_SIZES,
} from './utils/image-helpers.js';

// Load environment variables
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

// Initialize
const client = createSanityClient();
const usedFilenames = new Set();

// Portable text conversion is now handled by the comprehensive utility function
// No need for local implementation

// Generate Posts
const generatePosts = async () => {
  const outputDir = './content/posts';
  cleanDirectory(outputDir);

  const posts = await client.fetch(`*[_type == "post"]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    "heroImageUrl": heroImage.asset->url,
    "heroImageDimensions": heroImage.asset->metadata.dimensions,
    "heroImageAlt": heroImage.alt,
    content[]{
      ...,
      _type == "coloringPage" => {
        _type,
        title,
        "slug": slug.current,
        "imageUrl": image.asset->url
      },
      _type == "image" => {
        _type,
        "asset": {
          "url": asset->url
        },
        alt,
        caption
      }
    },
    "categories": category->title,
    author,
    publishedAt,
    featured,
    seoTitle,
    seoDescription
  }`);

  let skipped = 0;
  let generated = 0;

  for (const post of posts) {
    try {
      // Skip posts without essential data
      if (!post.title) {
        console.warn(`⚠️  Skipping post without title (ID: ${post._id})`);
        skipped++;
        continue;
      }

      const safeFilename = generateSafeFilename(post.slug, post.title, post._id, usedFilenames);
      const contentMarkdown = portableTextToMarkdown(post.content);

      // Auto-generate excerpt if none provided
      const description = post.excerpt || portableTextToExcerpt(post.content, 25);

      // Get optimized image URLs for post
      const images = getPostImages(post.heroImageUrl);
      const dimensions = getImageDimensions(post.heroImageDimensions, IMAGE_SIZES.hero);

      const frontmatter = {
        title: post.title,
        date: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : new Date().toISOString(),
        description: description,
        image: images.hero,
        thumbnail: images.thumbnail,
        image_srcset: images.srcset,
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: post.heroImageAlt,
        categories: post.categories ? [post.categories] : [],
        author: post.author,
        featured: post.featured || false,
        draft: false,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
      };

      const markdown = generateMarkdown(frontmatter, contentMarkdown);
      writeMarkdownFile(outputDir, safeFilename, markdown, post.title);
      generated++;
    } catch (error) {
      console.error(`❌ Error processing post "${post.title}" (${post._id}):`, error.message);
      skipped++;
    }
  }

  console.log(`✅ Generated ${generated} posts${skipped > 0 ? `, skipped ${skipped}` : ''}`);
};

// Generate Pages
const generatePages = async () => {
  const outputDir = './content/pages';
  cleanDirectory(outputDir);

  const pages = await client.fetch(`*[_type == "page"]{
    _id,
    title,
    "slug": slug.current,
    pageType,
    excerpt,
    content[]{
      ...,
      _type == "image" => {
        _type,
        "asset": {
          "url": asset->url
        },
        alt,
        caption
      }
    },
    "heroImageUrl": heroImage.asset->url,
    "heroImageAlt": heroImage.alt,
    lastUpdated,
    effectiveDate,
    seoTitle,
    seoDescription
  }`);

  let skipped = 0;
  let generated = 0;

  for (const page of pages) {
    try {
      if (!page.title) {
        console.warn(`⚠️  Skipping page without title (ID: ${page._id})`);
        skipped++;
        continue;
      }

      const safeFilename = generateSafeFilename(page.slug, page.title, page._id, usedFilenames);
      const contentMarkdown = portableTextToMarkdown(page.content);

      // Auto-generate description if none provided
      const description = page.excerpt || portableTextToExcerpt(page.content, 30);

      const frontmatter = {
        title: page.title,
        type: page.pageType || 'page',
        description: description,
        image: page.heroImageUrl,
        image_alt: page.heroImageAlt,
        last_updated: page.lastUpdated ? new Date(page.lastUpdated).toISOString() : undefined,
        effective_date: page.effectiveDate ? new Date(page.effectiveDate).toISOString() : undefined,
        layout: 'single',
        seo_title: page.seoTitle,
        seo_description: page.seoDescription,
      };

      const markdown = generateMarkdown(frontmatter, contentMarkdown);
      writeMarkdownFile(outputDir, safeFilename, markdown, page.title);
      generated++;
    } catch (error) {
      console.error(`❌ Error processing page "${page.title}" (${page._id}):`, error.message);
      skipped++;
    }
  }

  console.log(`✅ Generated ${generated} pages${skipped > 0 ? `, skipped ${skipped}` : ''}`);
};

// Generate Categories
const generateCategories = async () => {
  const outputDir = './content';

  // Clean up existing category files (but not other content)
  const existingFiles = fs
    .readdirSync(outputDir)
    .filter(file => file.endsWith('.md') && !['_index.md', 'categories.md'].includes(file));

  for (const file of existingFiles) {
    try {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if it's a category file by looking for main-category layout
      if (content.includes('layout: main-category')) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed old category file: ${file}`);
      }
    } catch (error) {
      // Ignore errors for files we can't read
    }
  }

  const categories = await client.fetch(`*[_type == "category"]{
    _id,
    title,
    "slug": slug.current,
    description,
    "imageUrl": categoryImage.asset->url,
    "imageDimensions": categoryImage.asset->metadata.dimensions,
    "imageAlt": categoryImage.alt,
    "parentTitle": parentCategory->title,
    sortOrder
  }`);

  let skipped = 0;
  let generated = 0;

  for (const category of categories) {
    try {
      if (!category.title) {
        console.warn(`⚠️  Skipping category without title (ID: ${category._id})`);
        skipped++;
        continue;
      }

      const safeFilename = generateSafeFilename(
        category.slug,
        category.title,
        category._id,
        usedFilenames
      );

      // Get optimized image URLs for category
      const images = getCategoryImages(category.imageUrl);
      const dimensions = getImageDimensions(
        category.imageDimensions,
        IMAGE_SIZES.category_thumbnail
      );

      const frontmatter = {
        title: category.title,
        description: category.description,
        layout: 'main-category',
        featureimage: images.thumbnail,
        hero_image: images.hero,
        image_srcset: images.srcset,
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: category.imageAlt,
        parent: category.parentTitle,
        weight: category.sortOrder,
      };

      const markdown = generateMarkdown(frontmatter, category.description || '');
      writeMarkdownFile(outputDir, safeFilename, markdown, category.title);
      generated++;
    } catch (error) {
      console.error(
        `❌ Error processing category "${category.title}" (${category._id}):`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Generated ${generated} categories${skipped > 0 ? `, skipped ${skipped}` : ''}`);
};

// Generate Coloring Pages
const generateColoringPages = async () => {
  const outputDir = './content/coloring-pages';
  cleanDirectory(outputDir);

  const coloringPages = await client.fetch(`*[_type == "coloringPage"]{
    _id,
    title,
    description,
    publishedAt,
    difficulty,
    "slug": slug.current,
    categories[]->{
      title,
      "slug": slug.current
    },
    "imageUrl": image.asset->url,
    "imageDimensions": image.asset->metadata.dimensions,
    "imageAlt": image.alt,
    "pdfUrl": pdfFile.asset->url,
    "continent": metadata.continent,
    "country": metadata.country,
    "tags": metadata.tags
  }`);

  let skipped = 0;
  let generated = 0;

  for (const page of coloringPages) {
    try {
      // Skip pages without essential data
      if (!page.title) {
        console.warn(`⚠️  Skipping coloring page without title (ID: ${page._id})`);
        skipped++;
        continue;
      }

      // Validate required fields
      if (!page.imageUrl) {
        console.warn(`⚠️  Skipping coloring page "${page.title}" - missing image`);
        skipped++;
        continue;
      }

      if (!page.pdfUrl) {
        console.warn(`⚠️  Skipping coloring page "${page.title}" - missing PDF`);
        skipped++;
        continue;
      }

      const safeFilename = generateSafeFilename(page.slug, page.title, page._id, usedFilenames);

      // Get optimized image URLs
      const images = getColoringPageImages(page.imageUrl);
      const dimensions = getImageDimensions(page.imageDimensions, IMAGE_SIZES.post_image);

      const frontmatter = {
        title: page.title,
        description: page.description,
        date: page.publishedAt
          ? new Date(page.publishedAt).toISOString()
          : new Date().toISOString(),
        difficulty: page.difficulty,
        image: images.main,
        thumbnail: images.thumbnail,
        small_thumbnail: images.small_thumbnail,
        hero_image: images.hero,
        image_srcset: images.srcset,
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: page.imageAlt,
        pdf_url: page.pdfUrl,
        categories: page.categories?.map(cat => cat.title) || [],
        continent: page.continent,
        country: page.country,
        tags: page.tags || [],
        type: 'coloring-page',
        layout: 'single',
      };

      const markdown = generateMarkdown(frontmatter, page.description || '');
      writeMarkdownFile(outputDir, safeFilename, markdown, page.title);
      generated++;
    } catch (error) {
      console.error(
        `❌ Error processing coloring page "${page.title}" (${page._id}):`,
        error.message
      );
      skipped++;
    }
  }

  console.log(
    `✅ Generated ${generated} coloring pages${skipped > 0 ? `, skipped ${skipped}` : ''}`
  );
};

// Main execution
(async () => {
  console.log('🚀 Starting Hugo + Sanity content generation...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Validate environment and test connection
    validateEnvironment();
    await testConnection(client);

    console.log('📝 Generating content...');
    const startTime = Date.now();

    // Run all content generation in parallel for faster builds
    await Promise.all([
      generatePosts(),
      generatePages(),
      generateCategories(),
      generateColoringPages(),
    ]);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Content generation completed successfully!');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Generated at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('\n❌ Content generation failed:', error.message);

    // Provide helpful debugging info
    if (error.message.includes('fetch')) {
      console.error('💡 This might be a network or permissions issue');
      console.error('   - Check your internet connection');
      console.error('   - Verify SANITY_PROJECT_ID and SANITY_DATASET');
      console.error('   - If dataset is private, set SANITY_TOKEN');
    }

    process.exit(1);
  }
})();

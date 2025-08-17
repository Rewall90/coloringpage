#!/usr/bin/env node

/**
 * Hugo + Sanity Content Generation Script - Section-based Structure
 *
 * This script fetches content from Sanity CMS and generates Hugo-compatible
 * section-based structure with clean URLs.
 *
 * Features:
 * - Local image downloading and optimization
 * - PDF mappings for Cloudflare Workers
 *
 * Usage:
 *   node scripts/fetch-sanity-content-sections.js
 *   npm run fetch-content-sections
 */

import fs from 'fs';
import path from 'path';

// Removed unused imports - createClient and yaml
import dotenv from 'dotenv';

// Import utility functions
import { validateEnvironment, createSanityClient, testConnection } from './utils/sanity-helpers.js';
import { generateMarkdown, generateSafeFilename, writeMarkdownFile } from './utils/file-helpers.js';
import { portableTextToMarkdown, portableTextToExcerpt } from './utils/portable-text-helpers.js';
import { getImageDimensions, IMAGE_SIZES } from './utils/image-helpers.js';
import { processAllImages } from './utils/image-processor.js';

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

// Global storage for image processing
let allCategories = [];
let allPosts = [];

// Local image system active

// Global asset mappings collection (PDFs and images)
const assetMappings = {};

// Clean up old category files
const cleanupOldCategories = () => {
  const contentDir = './content';

  // Remove old category .md files at root level
  const existingFiles = fs
    .readdirSync(contentDir)
    .filter(file => file.endsWith('.md') && !['_index.md'].includes(file));

  for (const file of existingFiles) {
    try {
      const filePath = path.join(contentDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if it's an old category file
      if (content.includes('layout: main-category') || content.includes('categories:')) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed old category file: ${file}`);
      }
    } catch (error) {
      // Ignore errors
    }
  }
};

// Generate Category Sections with Coloring Pages
const generateCategorySections = async () => {
  console.log('📁 Creating section-based structure...');

  // First, clean up old structure
  cleanupOldCategories();

  // Fetch all categories
  const categories = await client.fetch(`*[_type == "category"]{
    _id,
    title,
    "slug": slug.current,
    description,
    "categoryImageUrl": categoryImage.asset->url,
    "imageDimensions": categoryImage.asset->metadata.dimensions,
    "imageAlt": categoryImage.alt,
    sortOrder
  }`);

  // Store categories for image processing
  allCategories = categories;

  // Fetch all coloring pages AND posts with categories (treating them as coloring pages)
  const coloringPagesQuery = `*[_type == "coloringPage"]{
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
  }`;

  // Only fetch actual coloring pages
  const coloringPages = await client.fetch(coloringPagesQuery);

  let categoriesGenerated = 0;
  let pagesGenerated = 0;
  let skipped = 0;

  // Process each category
  for (const category of categories) {
    try {
      if (!category.title || !category.slug) {
        console.warn(`⚠️  Skipping category without title or slug (ID: ${category._id})`);
        skipped++;
        continue;
      }

      // Create section directory
      const sectionDir = path.join('./content', category.slug);
      if (!fs.existsSync(sectionDir)) {
        fs.mkdirSync(sectionDir, { recursive: true });
      }

      // Get optimized image URLs for category
      const dimensions = getImageDimensions(
        category.imageDimensions,
        IMAGE_SIZES.category_thumbnail
      );

      // Image mappings no longer needed - using local images

      // Create _index.md for the section (category landing page) with hierarchical URLs
      const categoryFrontmatter = {
        title: category.title,
        showBreadcrumbs: true,
        description: category.description,
        // Local images - dimensions for proper HTML rendering
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: category.imageAlt || category.title,
        weight: category.sortOrder || 50,
        // Section type (not cascaded to children)
        type: 'coloring-category',
      };

      const categoryMarkdown = generateMarkdown(categoryFrontmatter, category.description || '');
      const indexPath = path.join(sectionDir, '_index.md');
      fs.writeFileSync(indexPath, categoryMarkdown);
      console.log(`✅ Created section: ${category.slug}/_index.md`);
      categoriesGenerated++;

      // Add coloring pages to this category
      const categoryPages = coloringPages.filter(page =>
        page.categories?.some(cat => cat.slug === category.slug)
      );

      for (const page of categoryPages) {
        try {
          if (!page.title || !page.imageUrl) {
            console.warn(`⚠️  Skipping incomplete coloring page "${page.title}" - missing image`);
            continue;
          }

          const pageSlug =
            page.slug || generateSafeFilename(null, page.title, page._id, usedFilenames);

          // Collect PDF mapping for Cloudflare Worker (hierarchical only)
          if (page.pdfUrl) {
            const hierarchicalKey = `${category.slug}/${pageSlug}/${pageSlug}`;
            assetMappings[hierarchicalKey] = page.pdfUrl;
          }

          // Get image dimensions for local images
          const pageDimensions = getImageDimensions(page.imageDimensions, IMAGE_SIZES.post_image);

          const pageFrontmatter = {
            title: page.title,
            description: page.description,
            date: page.publishedAt
              ? new Date(page.publishedAt).toISOString()
              : new Date().toISOString(),
            difficulty: page.difficulty,
            // Local images - only need dimensions
            image_width: pageDimensions.width,
            image_height: pageDimensions.height,
            image_alt: page.imageAlt || page.title,
            pdf_url: page.pdfUrl ? `${page.pdfUrl}?dl=${pageSlug}.pdf` : null,
            continent: page.continent,
            country: page.country,
            tags: page.tags || [],
            type: 'coloring-page',
          };

          const pageMarkdown = generateMarkdown(pageFrontmatter, page.description || '');
          const pagePath = path.join(sectionDir, `${pageSlug}.md`);
          fs.writeFileSync(pagePath, pageMarkdown);
          pagesGenerated++;

          // Image mappings no longer needed - using local images
        } catch (error) {
          console.error(`❌ Error processing coloring page "${page.title}":`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing category "${category.title}":`, error.message);
      skipped++;
    }
  }

  console.log(`\n📊 Section Generation Summary:`);
  console.log(`   ✅ ${categoriesGenerated} category sections created`);
  console.log(`   ✅ ${pagesGenerated} coloring pages added`);
  if (skipped > 0) {
    console.log(`   ⚠️  ${skipped} items skipped`);
  }
};

// Generate Posts in their category sections
const generatePostsInSections = async () => {
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
        description,
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
    "categorySlug": category->slug.current,
    "categoryTitle": category->title,
    author,
    publishedAt,
    featured,
    seoTitle,
    seoDescription
  }`);

  // Store posts for image processing
  allPosts = posts;

  let generated = 0;

  for (const post of posts) {
    try {
      if (!post.title) {
        continue;
      }

      // Determine output directory based on category
      let outputDir = './content/posts'; // default
      if (post.categorySlug) {
        outputDir = `./content/${post.categorySlug}`;
        // Ensure the directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
      }

      const safeFilename = generateSafeFilename(post.slug, post.title, post._id, usedFilenames);

      // Create page context for hierarchical PDF URLs
      const pageContext = {
        categorySlug: post.categorySlug,
        pageSlug: safeFilename,
      };

      const contentMarkdown = portableTextToMarkdown(post.content, assetMappings, pageContext);

      // Content already uses local images from portable text conversion

      const description = post.excerpt || portableTextToExcerpt(post.content, 25);

      const dimensions = getImageDimensions(post.heroImageDimensions, IMAGE_SIZES.hero);

      // Image mappings no longer needed - using local images

      const frontmatter = {
        title: post.title,
        date: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : new Date().toISOString(),
        // Local images - dimensions for proper HTML rendering
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: post.heroImageAlt,
        categories: post.categoryTitle ? [post.categoryTitle] : [],
        author: post.author,
        featured: post.featured || false,
        draft: false,
        showHero: true,
        showTableOfContents: true,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
      };

      // Add description as intro paragraph if it exists
      const introContent = description ? `${description}\n\n` : '';
      const fullContent = introContent + contentMarkdown;
      const markdown = generateMarkdown(frontmatter, fullContent);
      writeMarkdownFile(outputDir, safeFilename, markdown, post.title);
      generated++;

      // Image mappings no longer needed - using local images
    } catch (error) {
      console.error(`❌ Error processing post "${post.title}":`, error.message);
    }
  }

  console.log(`✅ Generated ${generated} posts in their category sections`);
};

// Save asset mappings (PDFs only) for Cloudflare Workers
const saveAssetMappings = () => {
  // Filter to only include PDF mappings (URLs containing '/files/')
  const pdfOnlyMappings = {};
  Object.entries(assetMappings).forEach(([key, url]) => {
    if (url.includes('/files/')) {
      pdfOnlyMappings[key] = url;
    }
  });

  if (Object.keys(pdfOnlyMappings).length === 0) {
    console.log('📄 No PDF mappings to save');
    return;
  }

  const mappingsPath = './public/pdf-mappings.json';

  // Ensure public directory exists
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }

  fs.writeFileSync(mappingsPath, JSON.stringify(pdfOnlyMappings, null, 2));

  const pdfCount = Object.keys(pdfOnlyMappings).length;
  console.log(`📄 Saved ${pdfCount} PDF mappings to ${mappingsPath}`);
};

// Main execution
(async () => {
  try {
    // Validate environment and test connection
    validateEnvironment();
    await testConnection(client);

    // First, fetch all data without generating content
    console.log('📡 Fetching content from Sanity...');
    await Promise.all([
      generateCategorySections(), // This handles both categories and coloring pages
      generatePostsInSections(), // Posts go into their category sections
    ]);

    // Process images before content generation
    console.log('\n🎨 Processing images...');
    const imageResult = await processAllImages(allCategories, allPosts);

    if (!imageResult.success) {
      console.error('❌ Image processing failed');

      if (imageResult.summary.criticalFailures > 0) {
        console.error(
          `💥 ${imageResult.summary.criticalFailures} critical images failed to download`
        );
        console.error('   Homepage category images are required for the site to function properly');
        process.exit(1);
      } else if (imageResult.summary.failed > 0) {
        console.warn(`⚠️  ${imageResult.summary.failed} content images failed to download`);
        console.warn('   Site will continue building, but some images may be missing');
      }
    } else {
      console.log(`✅ Image processing completed successfully!`);
      if (imageResult.summary.total > 0) {
        console.log(
          `   Downloaded: ${imageResult.summary.downloaded}, Skipped: ${imageResult.summary.skipped}`
        );
      }
    }

    // Save asset mappings for Cloudflare Workers (for PDFs only now)
    saveAssetMappings();
  } catch (error) {
    console.error('\n❌ Content generation failed:', error.message);

    if (error.message.includes('fetch')) {
      console.error('💡 This might be a network or permissions issue');
      console.error('   - Check your internet connection');
      console.error('   - Verify SANITY_PROJECT_ID and SANITY_DATASET');
      console.error('   - If dataset is private, set SANITY_TOKEN');
    }

    process.exit(1);
  }
})();

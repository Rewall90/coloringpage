#!/usr/bin/env node

/**
 * Hugo + Sanity Content Generation Script - Section-based Structure
 *
 * This script fetches content from Sanity CMS and generates Hugo-compatible
 * section-based structure with clean URLs.
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
    "imageUrl": categoryImage.asset->url,
    "imageDimensions": categoryImage.asset->metadata.dimensions,
    "imageAlt": categoryImage.alt,
    sortOrder
  }`);

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
      const images = getCategoryImages(category.imageUrl);
      const dimensions = getImageDimensions(
        category.imageDimensions,
        IMAGE_SIZES.category_thumbnail
      );

      // Create _index.md for the section (category landing page)
      const categoryFrontmatter = {
        title: category.title,
        description: category.description,
        featureimage: images.thumbnail,
        hero_image: images.hero,
        image_srcset: images.srcset,
        image_width: dimensions.width,
        image_height: dimensions.height,
        image_alt: category.imageAlt || category.title,
        weight: category.sortOrder || 50,
        // Add these for homepage detection
        cascade: {
          type: 'coloring-category',
        },
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

          // Get optimized image URLs
          const pageImages = getColoringPageImages(page.imageUrl);
          const pageDimensions = getImageDimensions(page.imageDimensions, IMAGE_SIZES.post_image);

          const pageFrontmatter = {
            title: page.title,
            description: page.description,
            date: page.publishedAt
              ? new Date(page.publishedAt).toISOString()
              : new Date().toISOString(),
            difficulty: page.difficulty,
            image: pageImages.main,
            thumbnail: pageImages.thumbnail,
            small_thumbnail: pageImages.small_thumbnail,
            hero_image: pageImages.hero,
            image_srcset: pageImages.srcset,
            image_width: pageDimensions.width,
            image_height: pageDimensions.height,
            image_alt: page.imageAlt || page.title,
            pdf_url: page.pdfUrl,
            continent: page.continent,
            country: page.country,
            tags: page.tags || [],
            type: 'coloring-page',
          };

          const pageMarkdown = generateMarkdown(pageFrontmatter, page.description || '');
          const pagePath = path.join(sectionDir, `${pageSlug}.md`);
          fs.writeFileSync(pagePath, pageMarkdown);
          pagesGenerated++;
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
      const contentMarkdown = portableTextToMarkdown(post.content);
      const description = post.excerpt || portableTextToExcerpt(post.content, 25);

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
        categories: post.categoryTitle ? [post.categoryTitle] : [],
        author: post.author,
        featured: post.featured || false,
        draft: false,
        showHero: true,
        showTableOfContents: true,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
      };

      const markdown = generateMarkdown(frontmatter, contentMarkdown);
      writeMarkdownFile(outputDir, safeFilename, markdown, post.title);
      generated++;
    } catch (error) {
      console.error(`❌ Error processing post "${post.title}":`, error.message);
    }
  }

  console.log(`✅ Generated ${generated} posts in their category sections`);
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

  let generated = 0;

  for (const page of pages) {
    try {
      if (!page.title) {
        continue;
      }

      const safeFilename = generateSafeFilename(page.slug, page.title, page._id, usedFilenames);
      const contentMarkdown = portableTextToMarkdown(page.content);
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
      console.error(`❌ Error processing page "${page.title}":`, error.message);
    }
  }

  console.log(`✅ Generated ${generated} pages`);
};

// Main execution
(async () => {
  console.log('🚀 Starting Hugo + Sanity content generation (Section-based)...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Validate environment and test connection
    validateEnvironment();
    await testConnection(client);

    console.log('📝 Generating content with section-based structure...');
    const startTime = Date.now();

    // Run content generation
    await Promise.all([
      generateCategorySections(), // This handles both categories and coloring pages
      generatePostsInSections(), // Posts go into their category sections
      generatePages(),
    ]);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Content generation completed successfully!');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Generated at: ${new Date().toISOString()}`);
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

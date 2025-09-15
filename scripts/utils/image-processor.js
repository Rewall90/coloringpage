/**
 * Image Processing Pipeline
 *
 * Main orchestrator for downloading and processing images from Sanity CMS
 * to local static files. Integrates with the existing build pipeline.
 */

import {
  IMAGE_CONFIGS,
  initializeDirectories,
  downloadImages,
  cleanupOrphanedImages,
  generateLocalImagePath,
} from "./image-download-helpers.js";
import { generateSafeFilename } from "./file-helpers.js";

/**
 * Extract image information from Sanity content blocks
 */
const extractContentImages = (content, categorySlug, pageSlug) => {
  const images = [];

  if (!content || !Array.isArray(content)) {
    return images;
  }

  // Look for coloring page blocks in the content
  const coloringPageBlocks = content.filter(
    (block) => block._type === "coloringPage",
  );

  coloringPageBlocks.forEach((block) => {
    if (block.title && block.imageUrl) {
      // Generate safe filename for the image
      const imageSlug = generateSafeFilename(
        block.slug || block.title,
        block.title,
        "",
        new Set(),
      );

      images.push({
        title: block.title,
        imageUrl: block.imageUrl,
        imageSlug,
        categorySlug,
        pageSlug,
        type: "content_image",
      });
    }
  });

  return images;
};

/**
 * Create image context for download processing
 */
const createImageContext = (imageInfo) => {
  const { type, categorySlug, pageSlug, imageSlug } = imageInfo;

  // Determine config based on image type
  let config;
  if (type === "homepage_category") {
    config = IMAGE_CONFIGS.HOMEPAGE_CATEGORY;
  } else if (type === "hero_image") {
    config = IMAGE_CONFIGS.HERO_IMAGE;
  } else if (type === "card_image") {
    config = IMAGE_CONFIGS.CARD_IMAGE;
  } else {
    config = IMAGE_CONFIGS.CONTENT_IMAGE;
  }

  return {
    type,
    categorySlug,
    pageSlug,
    imageSlug,
    config,
  };
};

/**
 * Process category images (both homepage and content)
 */
export const processCategoryImages = async (categories) => {
  const imageRequests = [];

  for (const category of categories) {
    // Use the correct field name from the query
    const imageUrl = category.categoryImageUrl;
    if (!imageUrl) {
      continue;
    }

    const categorySlug = category.slug;

    // Homepage category image (600x600)
    const homepageContext = createImageContext({
      type: "homepage_category",
      categorySlug,
      pageSlug: null,
      imageSlug: categorySlug,
    });

    imageRequests.push({
      imageContext: homepageContext,
      sanityUrl: imageUrl,
      source: `category:${category.title} (homepage)`,
    });

    // Category page image (750x1000) - if different from homepage
    const contentContext = createImageContext({
      type: "content_image",
      categorySlug,
      pageSlug: "category-header",
      imageSlug: categorySlug,
    });

    imageRequests.push({
      imageContext: contentContext,
      sanityUrl: imageUrl,
      source: `category:${category.title} (content)`,
    });
  }

  console.log(`📸 Found ${imageRequests.length} category images to process`);
  return imageRequests;
};

/**
 * Process post/collection images from content
 */
export const processContentImages = async (posts) => {
  const imageRequests = [];

  for (const post of posts) {
    if (!post.content) {
      continue;
    }

    const categorySlug = post.categorySlug;
    const pageSlug = generateSafeFilename(
      post.slug,
      post.title,
      post._id,
      new Set(),
    );

    // Extract images from Sanity content blocks
    const contentImages = extractContentImages(
      post.content,
      categorySlug,
      pageSlug,
    );

    for (const imageInfo of contentImages) {
      const imageContext = createImageContext(imageInfo);

      imageRequests.push({
        imageContext,
        sanityUrl: imageInfo.imageUrl,
        source: `post:${post.title} -> ${imageInfo.title}`,
      });
    }

    // Process hero image if exists
    if (post.heroImageUrl) {
      const heroImageSlug = post.heroImageFilename || "hero";
      const heroContext = createImageContext({
        type: "hero_image",
        categorySlug,
        pageSlug,
        imageSlug: heroImageSlug,
      });

      imageRequests.push({
        imageContext: heroContext,
        sanityUrl: post.heroImageUrl,
        source: `post:${post.title} (hero image)`,
      });
    }

    // Process card image if exists
    if (post.cardImageUrl) {
      const cardImageSlug = post.cardImageFilename || "card";
      const cardContext = createImageContext({
        type: "card_image",
        categorySlug,
        pageSlug,
        imageSlug: cardImageSlug,
      });

      imageRequests.push({
        imageContext: cardContext,
        sanityUrl: post.cardImageUrl,
        source: `post:${post.title} (card image)`,
      });
    }
  }

  console.log(`📸 Found ${imageRequests.length} content images to process`);
  return imageRequests;
};

/**
 * Main image processing pipeline
 */
export const processAllImages = async (categories, posts) => {
  console.log("\n🎨 Starting Image Processing Pipeline...\n");

  // Initialize directories
  initializeDirectories();

  // Collect all image requests
  const categoryImageRequests = await processCategoryImages(categories);
  const contentImageRequests = await processContentImages(posts);

  const allImageRequests = [...categoryImageRequests, ...contentImageRequests];

  if (allImageRequests.length === 0) {
    console.log("📭 No images to process");
    return {
      success: true,
      summary: { total: 0, downloaded: 0, skipped: 0, failed: 0 },
    };
  }

  // Log what we're about to process
  console.log(`📋 Image Processing Summary:`);
  console.log(`   Category images: ${categoryImageRequests.length}`);
  console.log(`   Content images: ${contentImageRequests.length}`);
  console.log(`   Total images: ${allImageRequests.length}\n`);

  // Mark critical images (homepage category images are critical)
  allImageRequests.forEach((req) => {
    req.critical = req.imageContext.type === "homepage_category";
  });

  // Download images with retry for critical failures
  const downloadResults = await downloadImages(allImageRequests, 3);

  // Check for critical failures
  const criticalFailures = [];
  allImageRequests.forEach((req, index) => {
    if (req.critical && downloadResults.errors[index]) {
      criticalFailures.push(downloadResults.errors[index]);
    }
  });

  if (criticalFailures.length > 0) {
    console.error(`\n💥 Critical image failures detected:`);
    criticalFailures.forEach((error) => console.error(`   • ${error}`));

    // Retry critical images once more
    console.log(`\n🔄 Retrying ${criticalFailures.length} critical images...`);
    const criticalRequests = allImageRequests.filter((req) => req.critical);
    const retryResults = await downloadImages(criticalRequests, 1);

    if (retryResults.failed > 0) {
      return {
        success: false,
        summary: {
          ...downloadResults,
          criticalFailures: retryResults.failed,
        },
      };
    }
  }

  // Clean up orphaned images
  const currentImagePaths = allImageRequests.map(
    (req) => generateLocalImagePath(req.imageContext).relativePath,
  );
  cleanupOrphanedImages(currentImagePaths);

  console.log("\n✨ Image processing completed!\n");

  // Success if no critical failures, even if some content images failed
  const success = criticalFailures.length === 0 || downloadResults.failed === 0;

  return {
    success,
    summary: {
      ...downloadResults,
      criticalFailures: criticalFailures.length,
    },
  };
};

/**
 * Get local image path for use in templates
 */
export const getLocalImagePath = (imageInfo) => {
  const imageContext = createImageContext(imageInfo);
  const { relativePath } = generateLocalImagePath(imageContext);
  return relativePath;
};

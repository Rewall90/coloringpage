/**
 * Image Download Utilities
 *
 * Helper functions for downloading and processing images from Sanity CDN
 * to local static files with specific dimensions and optimization.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath, URLSearchParams } from 'url';
import { setTimeout } from 'timers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image size configurations
export const IMAGE_CONFIGS = {
  HOMEPAGE_CATEGORY: { width: 600, height: 600, suffix: '600x600' },
  CONTENT_IMAGE: { width: 750, height: 1000, suffix: '750x1000' },
};

// Base paths
const STATIC_DIR = path.resolve(__dirname, '../../static');
const IMAGES_DIR = path.join(STATIC_DIR, 'images');
const COLLECTIONS_DIR = path.join(IMAGES_DIR, 'collections');
const CATEGORIES_DIR = path.join(IMAGES_DIR, 'categories');
const MANIFEST_FILE = path.join(IMAGES_DIR, '.download-manifest.json');

/**
 * Initialize directory structure
 */
export const initializeDirectories = () => {
  const dirs = [STATIC_DIR, IMAGES_DIR, COLLECTIONS_DIR, CATEGORIES_DIR];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${path.relative(process.cwd(), dir)}`);
    }
  });
};

/**
 * Load existing download manifest
 */
export const loadManifest = () => {
  if (!fs.existsSync(MANIFEST_FILE)) {
    return {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      images: {},
    };
  }

  try {
    const manifestData = fs.readFileSync(MANIFEST_FILE, 'utf-8');
    return JSON.parse(manifestData);
  } catch (error) {
    console.warn('⚠️  Invalid manifest file, creating new one');
    return {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      images: {},
    };
  }
};

/**
 * Save download manifest
 */
export const saveManifest = manifest => {
  manifest.lastUpdate = new Date().toISOString();
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
};

/**
 * Generate file hash from URL for change detection
 */
const generateUrlHash = url => {
  // Simple hash based on URL - in production you might want to use file content hash
  return Buffer.from(url).toString('base64').slice(0, 16);
};

/**
 * Download file from URL with error handling and retries
 */
const downloadFile = (url, outputPath, maxRetries = 3) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = () => {
      attempts++;

      const file = fs.createWriteStream(outputPath);
      const request = https.get(url, response => {
        if (response.statusCode === 200) {
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve(outputPath);
          });

          file.on('error', err => {
            fs.unlink(outputPath, () => {}); // Clean up partial file
            if (attempts < maxRetries) {
              console.log(`⚠️  Retry ${attempts}/${maxRetries} for ${path.basename(outputPath)}`);
              setTimeout(attempt, 1000 * attempts); // Progressive delay
            } else {
              reject(new Error(`Download failed after ${maxRetries} attempts: ${err.message}`));
            }
          });
        } else {
          file.close();
          fs.unlink(outputPath, () => {}); // Clean up empty file
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });

      request.on('error', err => {
        file.close();
        fs.unlink(outputPath, () => {}); // Clean up partial file
        if (attempts < maxRetries) {
          console.log(`⚠️  Retry ${attempts}/${maxRetries} for ${path.basename(outputPath)}`);
          setTimeout(attempt, 1000 * attempts); // Progressive delay
        } else {
          reject(new Error(`Request failed after ${maxRetries} attempts: ${err.message}`));
        }
      });

      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    };

    attempt();
  });
};

/**
 * Build optimized Sanity CDN URL with transformations
 */
export const buildSanityImageUrl = (baseUrl, config) => {
  // Extract the base URL without existing parameters
  const cleanUrl = baseUrl.split('?')[0];

  // Add Sanity CDN transformations
  const params = new URLSearchParams({
    w: config.width.toString(),
    h: config.height.toString(),
    fit: 'crop',
    crop: 'center',
    fm: 'webp',
    q: '85',
    auto: 'format',
  });

  return `${cleanUrl}?${params.toString()}`;
};

/**
 * Generate local file path for an image
 */
export const generateLocalImagePath = imageContext => {
  const { type, categorySlug, pageSlug, imageSlug, config } = imageContext;

  if (type === 'homepage_category') {
    // Homepage category images: /images/categories/animals-600x600.webp
    const filename = `${categorySlug}-${config.suffix}.webp`;
    return {
      fullPath: path.join(CATEGORIES_DIR, filename),
      relativePath: `/images/categories/${filename}`,
    };
  } else {
    // Content images: /images/collections/animals/farm-animals/image-750x1000.webp
    const categoryDir = path.join(COLLECTIONS_DIR, categorySlug);
    const pageDir = path.join(categoryDir, pageSlug);
    const filename = `${imageSlug}-${config.suffix}.webp`;

    // Ensure directory exists
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    return {
      fullPath: path.join(pageDir, filename),
      relativePath: `/images/collections/${categorySlug}/${pageSlug}/${filename}`,
    };
  }
};

/**
 * Check if image needs to be downloaded
 */
export const needsDownload = (manifest, imageContext, sanityUrl) => {
  const { relativePath } = generateLocalImagePath(imageContext);
  const urlHash = generateUrlHash(sanityUrl);

  // Check if file exists in manifest
  const manifestEntry = manifest.images[relativePath];
  if (!manifestEntry) {
    return true; // New file
  }

  // Check if URL has changed
  if (manifestEntry.urlHash !== urlHash) {
    return true; // URL changed
  }

  // Check if local file exists
  const { fullPath } = generateLocalImagePath(imageContext);
  if (!fs.existsSync(fullPath)) {
    return true; // File missing
  }

  return false; // File up to date
};

/**
 * Download and process a single image
 */
export const downloadImage = async (imageContext, sanityUrl, manifest) => {
  const { config } = imageContext;
  const { fullPath, relativePath } = generateLocalImagePath(imageContext);

  // Check if download is needed
  if (!needsDownload(manifest, imageContext, sanityUrl)) {
    console.log(`⏭️  Skipping (up to date): ${path.basename(fullPath)}`);
    return { success: true, skipped: true, relativePath };
  }

  console.log(`⬬ Downloading: ${path.basename(fullPath)}`);

  try {
    // Build optimized Sanity URL
    const optimizedUrl = buildSanityImageUrl(sanityUrl, config);

    // Download the file
    await downloadFile(optimizedUrl, fullPath);

    // Update manifest
    const urlHash = generateUrlHash(sanityUrl);
    manifest.images[relativePath] = {
      sanityUrl,
      urlHash,
      downloadedAt: new Date().toISOString(),
      fileSize: fs.statSync(fullPath).size,
      dimensions: `${config.width}x${config.height}`,
    };

    console.log(
      `✅ Downloaded: ${path.basename(fullPath)} (${manifest.images[relativePath].fileSize} bytes)`
    );
    return { success: true, skipped: false, relativePath };
  } catch (error) {
    console.error(`❌ Failed to download ${path.basename(fullPath)}:`, error.message);
    return { success: false, error: error.message, relativePath };
  }
};

/**
 * Download multiple images with concurrency control
 */
export const downloadImages = async (imageRequests, maxConcurrency = 3) => {
  const manifest = loadManifest();
  const results = {
    total: imageRequests.length,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log(
    `🚀 Starting download of ${imageRequests.length} images (max ${maxConcurrency} concurrent)...`
  );

  // Process images in batches to control concurrency
  for (let i = 0; i < imageRequests.length; i += maxConcurrency) {
    const batch = imageRequests.slice(i, i + maxConcurrency);

    const batchPromises = batch.map(request =>
      downloadImage(request.imageContext, request.sanityUrl, manifest)
    );

    const batchResults = await Promise.all(batchPromises);

    // Process results
    batchResults.forEach(result => {
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.downloaded++;
        }
      } else {
        results.failed++;
        results.errors.push(result.error);
      }
    });

    // Progress update
    const processed = Math.min(i + maxConcurrency, imageRequests.length);
    console.log(`📊 Progress: ${processed}/${imageRequests.length} processed`);
  }

  // Save updated manifest
  saveManifest(manifest);

  console.log(`\n📈 Download Summary:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Downloaded: ${results.downloaded}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    results.errors.forEach(error => console.log(`   • ${error}`));
  }

  return results;
};

/**
 * Clean up orphaned images (files that are no longer referenced)
 */
export const cleanupOrphanedImages = currentImagePaths => {
  const manifest = loadManifest();
  const manifestPaths = new Set(Object.keys(manifest.images));
  const currentPaths = new Set(currentImagePaths);

  const orphanedPaths = [...manifestPaths].filter(path => !currentPaths.has(path));

  if (orphanedPaths.length === 0) {
    console.log(`🧹 No orphaned images to clean up`);
    return;
  }

  console.log(`🧹 Cleaning up ${orphanedPaths.length} orphaned images...`);

  orphanedPaths.forEach(relativePath => {
    const fullPath = path.join(STATIC_DIR, relativePath.replace(/^\//, ''));

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️  Removed: ${relativePath}`);
      }

      // Remove from manifest
      delete manifest.images[relativePath];
    } catch (error) {
      console.error(`❌ Failed to remove ${relativePath}:`, error.message);
    }
  });

  saveManifest(manifest);
};

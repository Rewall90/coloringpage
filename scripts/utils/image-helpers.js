/**
 * Image Optimization Utilities
 *
 * Helper functions for optimizing Sanity CDN image URLs with proper sizing,
 * format conversion, and quality settings for different use cases.
 */

/**
 * Standard image sizes for different contexts
 */
export const IMAGE_SIZES = {
  category_thumbnail: { w: 600, h: 800 },
  hero: { w: 1920, h: 600 },
  post_image: { w: 1200, h: 1200 },
};

/**
 * Optimize Sanity image URL with parameters
 *
 * @param {string} url - The base Sanity image URL
 * @param {Object} params - URL parameters for optimization
 * @param {number} params.w - Width in pixels
 * @param {number} params.h - Height in pixels
 * @param {string} params.fit - Fit mode (crop, clip, fill, etc.)
 * @param {string} params.fm - Format (webp, jpg, png)
 * @param {number} params.q - Quality (1-100)
 * @param {string} params.auto - Auto optimization (format)
 * @returns {string} Optimized image URL
 */

/**
 * Extract dimensions from Sanity image metadata
 *
 * @param {Object} dimensions - Dimensions object from Sanity
 * @param {Object} sizePreset - Size preset to use as fallback
 * @returns {Object} Width and height values
 */
export const getImageDimensions = (dimensions, sizePreset = IMAGE_SIZES.post_image) => {
  return {
    width: dimensions?.width || sizePreset.w,
    height: dimensions?.height || sizePreset.h,
  };
};

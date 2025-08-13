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
  post_thumbnail: { w: 800, h: 800 },
  post_image: { w: 1200, h: 1200 },
  small_thumbnail: { w: 200, h: 200 },
};

/**
 * Quality presets for different image types
 */
export const QUALITY_PRESETS = {
  thumbnail: 75,
  standard: 85,
  hero: 90,
  high: 95,
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
export const optimizeImageUrl = (url, params = {}) => {
  if (!url) {
    return '';
  }

  // Default optimization parameters
  const defaults = {
    auto: 'format', // Auto-detect best format (WebP for supported browsers)
    q: QUALITY_PRESETS.standard,
  };

  // Merge defaults with provided params
  const finalParams = { ...defaults, ...params };

  // Build query string
  const queryParams = new globalThis.URLSearchParams(finalParams);

  // Check if URL already has query params
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}${queryParams.toString()}`;
};

/**
 * Generate responsive image URLs for srcset
 *
 * @param {string} url - The base Sanity image URL
 * @param {Array} widths - Array of widths for responsive images
 * @param {Object} baseParams - Base parameters to apply to all sizes
 * @returns {string} Formatted srcset string
 */
export const generateSrcset = (url, widths = [400, 800, 1200, 1600], baseParams = {}) => {
  if (!url) {
    return '';
  }

  return widths
    .map(w => {
      const optimized = optimizeImageUrl(url, { ...baseParams, w });
      return `${optimized} ${w}w`;
    })
    .join(', ');
};

/**
 * Get optimized URLs for a coloring page
 *
 * @param {string} imageUrl - The base Sanity image URL
 * @returns {Object} Object with optimized URLs for different uses
 */
export const getColoringPageImages = imageUrl => {
  if (!imageUrl) {
    return {
      main: '',
      thumbnail: '',
      hero: '',
      srcset: '',
    };
  }

  return {
    // Main image for display
    main: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.post_image,
      q: QUALITY_PRESETS.standard,
    }),

    // Thumbnail for listings
    thumbnail: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.post_thumbnail,
      q: QUALITY_PRESETS.thumbnail,
      fit: 'crop',
    }),

    // Small thumbnail for compact lists
    small_thumbnail: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.small_thumbnail,
      q: QUALITY_PRESETS.thumbnail,
      fit: 'crop',
    }),

    // Hero image if used in featured section
    hero: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.hero,
      q: QUALITY_PRESETS.hero,
      fit: 'crop',
    }),

    // Responsive srcset for modern browsers
    srcset: generateSrcset(imageUrl, [400, 800, 1200, 1600]),
  };
};

/**
 * Get optimized URLs for a category
 *
 * @param {string} imageUrl - The base Sanity image URL
 * @returns {Object} Object with optimized URLs for different uses
 */
export const getCategoryImages = imageUrl => {
  if (!imageUrl) {
    return {
      thumbnail: '',
      hero: '',
      srcset: '',
    };
  }

  return {
    // Category thumbnail
    thumbnail: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.category_thumbnail,
      q: QUALITY_PRESETS.thumbnail,
      fit: 'crop',
    }),

    // Category hero (if used as featured)
    hero: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.hero,
      q: QUALITY_PRESETS.hero,
      fit: 'crop',
    }),

    // Responsive srcset
    srcset: generateSrcset(imageUrl, [400, 800, 1200]),
  };
};

/**
 * Get optimized URLs for a blog post
 *
 * @param {string} imageUrl - The base Sanity image URL
 * @returns {Object} Object with optimized URLs for different uses
 */
export const getPostImages = imageUrl => {
  if (!imageUrl) {
    return {
      hero: '',
      thumbnail: '',
      srcset: '',
    };
  }

  return {
    // Hero image for post header
    hero: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.hero,
      q: QUALITY_PRESETS.hero,
    }),

    // Thumbnail for post listings
    thumbnail: optimizeImageUrl(imageUrl, {
      ...IMAGE_SIZES.post_thumbnail,
      q: QUALITY_PRESETS.thumbnail,
      fit: 'crop',
    }),

    // Responsive srcset
    srcset: generateSrcset(imageUrl, [400, 800, 1200, 1920]),
  };
};

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

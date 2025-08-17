/**
 * Cloudflare Image Optimization Utilities
 *
 * Helper functions for generating Cloudflare-optimized image URLs that provide
 * similar functionality to Sanity CDN with the added benefit of SEO-friendly URLs.
 */

/**
 * Base URL for your Cloudflare Worker image proxy
 * Update this to match your actual Worker domain
 */
const CLOUDFLARE_IMAGE_DOMAIN = 'https://images.coloringvault.com'; // Replace with your domain

/**
 * Standard image sizes for different contexts
 */
export const CF_IMAGE_SIZES = {
  category_thumbnail: { w: 600, h: 800 },
  hero: { w: 1920, h: 600 },
  post_thumbnail: { w: 800, h: 800 },
  post_image: { w: 1200, h: 1200 },
  small_thumbnail: { w: 200, h: 200 },
};

/**
 * Quality presets for different image types
 */
export const CF_QUALITY_PRESETS = {
  thumbnail: 75,
  standard: 85,
  hero: 90,
  high: 95,
};

/**
 * Generate Cloudflare-optimized image URL
 *
 * @param {string} seoPath - SEO-friendly path (e.g., "/main-category/animals/cat.webp")
 * @param {Object} params - Transformation parameters
 * @returns {string} Optimized Cloudflare image URL
 */
export const generateCloudflareImageUrl = (seoPath, params = {}) => {
  if (!seoPath) {
    return '';
  }

  // Default optimization parameters
  const defaults = {
    format: 'auto', // Auto-detect best format (WebP/AVIF for supported browsers)
    q: CF_QUALITY_PRESETS.standard,
  };

  // Merge defaults with provided params
  const finalParams = { ...defaults, ...params };

  // Build query string
  // Use built-in URLSearchParams (Node.js 16+)
  const queryParams = new globalThis.URLSearchParams();
  Object.entries(finalParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  const separator = queryString ? '?' : '';

  return `${CLOUDFLARE_IMAGE_DOMAIN}${seoPath}${separator}${queryString}`;
};

/**
 * Generate responsive image URLs for srcset using Cloudflare transformations
 *
 * @param {string} seoPath - SEO-friendly path
 * @param {Array} widths - Array of widths for responsive images
 * @param {Object} baseParams - Base parameters to apply to all sizes
 * @returns {string} Formatted srcset string
 */
export const generateCloudflareSrcset = (
  seoPath,
  widths = [400, 800, 1200, 1600],
  baseParams = {}
) => {
  if (!seoPath) {
    return '';
  }

  return widths
    .map(w => {
      const optimized = generateCloudflareImageUrl(seoPath, { ...baseParams, w });
      return `${optimized} ${w}w`;
    })
    .join(', ');
};

/**
 * Get optimized Cloudflare URLs for a coloring page
 *
 * @param {string} seoPath - SEO-friendly path for the image
 * @returns {Object} Object with optimized URLs for different uses
 */
export const getCloudflareColoringPageImages = seoPath => {
  if (!seoPath) {
    return {
      main: '',
      thumbnail: '',
      hero: '',
      srcset: '',
    };
  }

  return {
    // Main image for display
    main: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.post_image,
      q: CF_QUALITY_PRESETS.standard,
    }),

    // Thumbnail for listings
    thumbnail: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.post_thumbnail,
      q: CF_QUALITY_PRESETS.thumbnail,
      fit: 'cover',
    }),

    // Small thumbnail for compact lists
    small_thumbnail: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.small_thumbnail,
      q: CF_QUALITY_PRESETS.thumbnail,
      fit: 'cover',
    }),

    // Hero image if used in featured section
    hero: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.hero,
      q: CF_QUALITY_PRESETS.hero,
      fit: 'cover',
    }),

    // Responsive srcset for modern browsers
    srcset: generateCloudflareSrcset(seoPath, [400, 800, 1200, 1600], {
      q: CF_QUALITY_PRESETS.standard,
      fit: 'cover',
    }),
  };
};

/**
 * Get optimized Cloudflare URLs for a category
 *
 * @param {string} seoPath - SEO-friendly path for the image
 * @returns {Object} Object with optimized URLs for different uses
 */
export const getCloudflareCategoryImages = seoPath => {
  if (!seoPath) {
    return {
      thumbnail: '',
      hero: '',
      srcset: '',
    };
  }

  return {
    // Category thumbnail
    thumbnail: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.category_thumbnail,
      q: CF_QUALITY_PRESETS.thumbnail,
      fit: 'cover',
    }),

    // Category hero (if used as featured)
    hero: generateCloudflareImageUrl(seoPath, {
      ...CF_IMAGE_SIZES.hero,
      q: CF_QUALITY_PRESETS.hero,
      fit: 'cover',
    }),

    // Responsive srcset for category cards
    srcset: generateCloudflareSrcset(seoPath, [400, 600, 800, 1200], {
      q: CF_QUALITY_PRESETS.thumbnail,
      fit: 'cover',
    }),
  };
};

/**
 * Advanced Cloudflare transformations beyond Sanity capabilities
 */
export const getAdvancedCloudflareTransforms = (seoPath, options = {}) => {
  const {
    rotate = 0, // 0, 90, 180, 270
    flip = null, // 'h', 'v', 'hv'
    exposure = 1.0, // 0.5 = darker, 2.0 = lighter
    crop = 'auto', // 'auto' for smart cropping
    background = null, // Background color for pad mode
  } = options;

  const params = {};

  if (rotate !== 0) {
    params.rotate = rotate;
  }
  if (flip) {
    params.flip = flip;
  }
  if (exposure !== 1.0) {
    params.exposure = exposure;
  }
  if (crop !== 'auto') {
    params.crop = crop;
  }
  if (background) {
    params.bg = background;
  }

  return generateCloudflareImageUrl(seoPath, params);
};

/**
 * Migration helper: Convert Sanity URLs to Cloudflare SEO paths
 *
 * @param {string} sanityUrl - Original Sanity CDN URL
 * @param {string} category - Category for the SEO path
 * @param {string} filename - Filename for the SEO path
 * @returns {string} SEO-friendly path for Cloudflare
 */
export const sanityToCloudflareePath = (sanityUrl, category, filename) => {
  if (!sanityUrl || !category || !filename) {
    return '';
  }

  // Determine extension from Sanity URL or default to webp
  let extension = '.webp';
  if (sanityUrl.includes('.jpg') || sanityUrl.includes('.jpeg')) {
    extension = '.jpg';
  } else if (sanityUrl.includes('.png')) {
    extension = '.png';
  }

  return `/main-category/${category}/${filename}${extension}`;
};

/**
 * Extract transform parameters from Sanity URL and convert to Cloudflare format
 *
 * @param {string} sanityUrl - Sanity URL with parameters
 * @returns {Object} Cloudflare-compatible transform parameters
 */
export const convertSanityParams = sanityUrl => {
  if (!sanityUrl) {
    return {};
  }

  const url = new globalThis.URL(sanityUrl);
  const params = {};

  // Convert common parameters
  if (url.searchParams.has('w')) {
    params.w = parseInt(url.searchParams.get('w'));
  }
  if (url.searchParams.has('h')) {
    params.h = parseInt(url.searchParams.get('h'));
  }
  if (url.searchParams.has('q')) {
    params.q = parseInt(url.searchParams.get('q'));
  }
  if (url.searchParams.has('fit')) {
    params.fit = url.searchParams.get('fit');
  }
  if (url.searchParams.has('auto')) {
    params.format = 'auto';
  }

  return params;
};

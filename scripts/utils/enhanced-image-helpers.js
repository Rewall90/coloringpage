/**
 * Enhanced Image Helpers - Single Base Image + Dynamic Transformations
 *
 * This replaces the complex multi-size approach with simple base images
 * that can be transformed dynamically via Cloudflare Workers.
 */

/**
 * Generate base image URL for enhanced transformations
 * @param {string} categorySlug - Category slug
 * @param {string} itemSlug - Item slug
 * @param {string} imageType - Type: 'image', 'category-thumbnail', 'category-hero'
 * @returns {string} Base image URL
 */
export const getBaseImageUrl = (categorySlug, itemSlug = null, imageType = 'image') => {
  if (itemSlug) {
    // Collection items: /collections/category/item/image.webp
    return `/collections/${categorySlug}/${itemSlug}/${imageType}.webp`;
  } else {
    // Categories: /main-category/category/image.webp
    return `/main-category/${categorySlug}/${imageType}.webp`;
  }
};

/**
 * Generate responsive image URLs with dynamic transformations
 * @param {string} baseUrl - Base image URL
 * @returns {object} Responsive image configuration
 */
export const getResponsiveImageConfig = baseUrl => {
  return {
    // Base image for src attribute
    src: `${baseUrl}?w=300&h=400&fit=cover&q=85`,

    // Dynamic srcset - any size on demand
    srcset: [
      `${baseUrl}?w=200&h=267&fit=cover&q=75 200w`,
      `${baseUrl}?w=300&h=400&fit=cover&q=85 300w`,
      `${baseUrl}?w=768&h=1024&fit=cover&q=85 768w`,
      `${baseUrl}?w=896&h=1195&fit=cover&q=85 896w`,
    ].join(', '),

    // Sizes attribute for responsive behavior
    sizes: '(max-width: 300px) 200px, (max-width: 768px) 300px, (max-width: 1024px) 768px, 896px',

    // Individual size URLs for specific use cases
    thumbnail_small: `${baseUrl}?w=200&h=267&fit=cover&q=75`,
    thumbnail_medium: `${baseUrl}?w=300&h=400&fit=cover&q=85`,
    thumbnail_large: `${baseUrl}?w=768&h=1024&fit=cover&q=85`,
    thumbnail_xlarge: `${baseUrl}?w=896&h=1195&fit=cover&q=85`,

    // Alternative formats
    webp: `${baseUrl}?w=300&h=400&fit=cover&q=85&f=webp`,
    avif: `${baseUrl}?w=300&h=400&fit=cover&q=85&f=avif`,

    // Base URL for custom transformations
    base: baseUrl,
  };
};

/**
 * Generate enhanced frontmatter for Hugo with base image approach
 * @param {string} categorySlug - Category slug
 * @param {string} itemSlug - Item slug (optional)
 * @param {string} sanityImageUrl - Original Sanity image URL
 * @param {object} dimensions - Image dimensions
 * @returns {object} Enhanced frontmatter
 */
export const generateEnhancedFrontmatter = (categorySlug, itemSlug, sanityImageUrl, dimensions) => {
  const baseImageUrl = getBaseImageUrl(categorySlug, itemSlug);
  const responsive = getResponsiveImageConfig(baseImageUrl);

  return {
    // Base image configuration
    base_image_url: baseImageUrl,
    sanity_image_url: sanityImageUrl,

    // Backward compatibility with existing templates
    responsive_images: {
      thumbnail_200: responsive.thumbnail_small,
      thumbnail_300: responsive.thumbnail_medium,
      thumbnail_768: responsive.thumbnail_large,
      thumbnail_896: responsive.thumbnail_xlarge,
    },

    // Enhanced responsive configuration
    enhanced_responsive: responsive,

    // Image metadata
    image_width: dimensions.width,
    image_height: dimensions.height,
    image_alt: `${categorySlug} coloring page`,
  };
};

/**
 * Create simplified KV mappings (one per item instead of 4)
 * @param {string} categorySlug - Category slug
 * @param {string} itemSlug - Item slug (optional)
 * @param {string} sanityImageUrl - Sanity CDN URL
 * @param {string} imageType - Image type
 * @returns {object} KV mapping entry
 */
export const createSimplifiedKVMapping = (
  categorySlug,
  itemSlug,
  sanityImageUrl,
  imageType = 'image'
) => {
  let kvKey;

  if (itemSlug) {
    // Collection items: category/item/image
    kvKey = `${categorySlug}/${itemSlug}/${imageType}`;
  } else {
    // Categories: category/image
    kvKey = `${categorySlug}/${imageType}`;
  }

  return {
    key: kvKey,
    value: sanityImageUrl, // Store raw Sanity URL, transformations happen in Worker
  };
};

/**
 * Migration helper: Convert existing mappings to new format
 * @param {object} existingMappings - Current KV mappings
 * @returns {object} Converted mappings
 */
export const convertExistingMappings = existingMappings => {
  const newMappings = {};

  Object.keys(existingMappings).forEach(key => {
    // Convert thumbnail-300 to base image
    if (key.includes('/thumbnail-300')) {
      const baseKey = key.replace('/thumbnail-300', '/image');
      newMappings[baseKey] = existingMappings[key].split('?')[0]; // Remove size params
    }
    // Convert category-thumbnail to category/image
    else if (key.includes('/category-thumbnail')) {
      const baseKey = key.replace('/category-thumbnail', '/category-image');
      newMappings[baseKey] = existingMappings[key].split('?')[0];
    }
    // Convert category-hero to category/hero
    else if (key.includes('/category-hero')) {
      const baseKey = key.replace('/category-hero', '/category-hero');
      newMappings[baseKey] = existingMappings[key].split('?')[0];
    }
  });

  return newMappings;
};

/**
 * File and Markdown Generation Utilities
 *
 * Helper functions for generating safe filenames, creating markdown files
 * with YAML frontmatter, and managing directory operations.
 */

import fs from "fs";
import path from "path";

import yaml from "js-yaml";

/**
 * Clean and recreate directory
 */
export const cleanDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
};

/**
 * Generate safe filename with collision detection
 */
export const generateSafeFilename = (slug, title, id, usedFilenames) => {
  // Validate slug exists
  if (!slug || typeof slug !== "string") {
    console.warn(
      `⚠️  Missing slug for "${title}" (ID: ${id}), generating from title`,
    );
    slug = title || `untitled-${id}`;
  }

  // Sanitize slug - keep only alphanumeric, hyphens, underscores
  let safeSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, "-") // Replace invalid chars with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  // Fallback if sanitization resulted in empty string
  if (!safeSlug) {
    safeSlug = `item-${id}`;
    console.warn(
      `⚠️  Slug sanitization resulted in empty string for "${title}", using: ${safeSlug}`,
    );
  }

  // Handle collisions by appending counter
  let finalSlug = safeSlug;
  let counter = 1;

  while (usedFilenames.has(finalSlug)) {
    finalSlug = `${safeSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      console.error(`❌ Too many slug collisions for: ${safeSlug}`);
      throw new Error(`Slug collision limit exceeded for: ${safeSlug}`);
    }
  }

  // Log collision if we had to modify the slug
  if (finalSlug !== safeSlug) {
    console.warn(`⚠️  Slug collision detected: "${safeSlug}" → "${finalSlug}"`);
  }

  usedFilenames.add(finalSlug);
  return finalSlug;
};

/**
 * Generate markdown with safe YAML frontmatter
 */
export const generateMarkdown = (frontmatter, content = "") => {
  // Filter out undefined/null/empty values
  const cleanFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  const yamlFrontmatter = yaml.dump(cleanFrontmatter, {
    quotingType: '"',
    forceQuotes: false,
  });

  return `---\n${yamlFrontmatter}---\n\n${content}`;
};

/**
 * Write markdown file with error handling
 */
export const writeMarkdownFile = (outputDir, filename, content, title) => {
  const filePath = path.join(outputDir, `${filename}.md`);

  try {
    fs.writeFileSync(filePath, content);
  } catch (error) {
    console.error(`❌ Failed to write file: ${filePath}`, error.message);
    console.error(`   Content title: ${title}`);
    throw error;
  }
};

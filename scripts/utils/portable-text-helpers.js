/**
 * Portable Text to Markdown Conversion Utilities
 *
 * Comprehensive handling of Sanity's Portable Text format, converting
 * rich text content to Hugo-compatible markdown with proper formatting.
 */

// Custom portable text to markdown converter

/**
 * Convert Portable Text to Markdown with full formatting support
 *
 * Handles:
 * - Bold, italic, code formatting
 * - Headings (h1-h6)
 * - Lists (bulleted and numbered)
 * - Links with proper markdown syntax
 * - Block quotes
 * - Custom objects (coloringPage references, images, etc.)
 */
export const portableTextToMarkdown = (
  blocks,
  pdfMappings = null,
  pageContext = null,
) => {
  if (!blocks || !Array.isArray(blocks)) {
    return "";
  }

  try {
    const results = [];
    const processed = new Set(); // Track which blocks we've already processed

    for (let i = 0; i < blocks.length; i++) {
      // Skip if we've already processed this block as part of a group
      if (processed.has(i)) {
        continue;
      }

      const block = blocks[i];

      if (block._type === "block") {
        const style = block.style || "normal";
        const children = block.children || [];
        const text = children
          .map((child) => {
            let content = child.text || "";

            // Apply marks/formatting
            if (child.marks) {
              child.marks.forEach((mark) => {
                switch (mark) {
                  case "strong":
                    content = `**${content}**`;
                    break;
                  case "em":
                    content = `*${content}*`;
                    break;
                  case "code":
                    content = `\`${content}\``;
                    break;
                  case "underline":
                    content = `*${content}*`;
                    break;
                  case "strike-through":
                    content = `~~${content}~~`;
                    break;
                }
              });
            }

            return content;
          })
          .join("");

        // Apply block style
        switch (style) {
          case "h1":
            results.push(`# ${text}\n`);
            break;
          case "h2":
            results.push(`## ${text}\n`);
            break;
          case "h3":
            results.push(`### ${text}\n`);
            break;
          case "h4":
            results.push(`#### ${text}\n`);
            break;
          case "h5":
            results.push(`##### ${text}\n`);
            break;
          case "h6":
            results.push(`###### ${text}\n`);
            break;
          case "blockquote":
            results.push(`> ${text}\n`);
            break;
          default:
            results.push(`${text}\n`);
            break;
        }
      } else if (block._type === "image") {
        const alt = block.alt || "Image";
        if (block.asset && block.asset.url) {
          results.push(`\n![${alt}](${block.asset.url})\n`);
        }
      } else if (block._type === "code") {
        const language = block.language || "";
        results.push(`\n\`\`\`${language}\n${block.code}\n\`\`\`\n`);
      } else if (block._type === "coloringPage") {
        // Check if this starts a group of consecutive coloring pages
        const coloringGroup = [];
        let j = i;

        // Collect all consecutive coloring pages starting from current position
        while (j < blocks.length && blocks[j]._type === "coloringPage") {
          coloringGroup.push(blocks[j]);
          processed.add(j); // Mark this block as processed
          j++;
        }

        // Generate output based on group size
        if (coloringGroup.length === 1) {
          // Single coloring page - use individual format
          const coloringPage = coloringGroup[0];
          results.push(
            generateColoringPageShortcode(
              coloringPage,
              pdfMappings,
              pageContext,
            ),
          );
        } else {
          // Multiple coloring pages - wrap in grid
          results.push(`\n<div class="coloring-pages-grid">\n`);
          coloringGroup.forEach((coloringPage) => {
            results.push(
              generateColoringPageShortcode(
                coloringPage,
                pdfMappings,
                pageContext,
              ),
            );
          });
          results.push(`</div>\n`);
        }
      }
    }

    return results.join("\n");
  } catch (error) {
    console.warn(
      "⚠️  Error converting portable text to markdown:",
      error.message,
    );
    console.warn("   Falling back to simplified conversion");

    // Fallback to simplified conversion if main conversion fails
    return portableTextToMarkdownSimple(blocks);
  }
};

/**
 * Generate a coloring page shortcode from a coloringPage block
 * @param {Object} block - The coloring page block
 * @param {Object} pdfMappings - Object to collect PDF mappings
 * @param {Object} pageContext - Context about the current page (category, slug, etc.)
 */
const generateColoringPageShortcode = (
  block,
  pdfMappings = null,
  pageContext = null,
) => {
  const title = block.title || "Coloring Page";
  const description = block.description || "";

  // Create a coloring page embed shortcode
  let markdown = `\n{{< coloring-page-embed\n`;
  markdown += `  title="${title}"\n`;
  if (description) {
    markdown += `  description="${description}"\n`;
  }
  if (block.image?.asset?._ref) {
    // Generate local image path instead of Sanity CDN URL
    if (pageContext && pageContext.categorySlug && pageContext.pageSlug) {
      const imageSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const localImagePath = `/images/collections/${pageContext.categorySlug}/${pageContext.pageSlug}/${imageSlug}-750x1000.webp`;
      markdown += `  image="${localImagePath}"\n`;
    } else {
      // Fallback to Sanity CDN URL if no page context
      const imageId = block.image.asset._ref
        .replace("image-", "")
        .replace(/-([a-z]+)$/, ".$1");
      markdown += `  image="https://cdn.sanity.io/images/zjqmnotc/production/${imageId}"\n`;
    }
  }
  if (block.pdfFile?.asset?._ref) {
    // Extract file ID from reference
    const fileId = block.pdfFile.asset._ref
      .replace("file-", "")
      .replace(/-([a-z]+)$/, ".$1");
    const pdfUrl = `https://cdn.sanity.io/files/zjqmnotc/production/${fileId}`;
    markdown += `  pdf="${pdfUrl}"\n`;

    // Collect PDF mapping for Cloudflare Worker
    if (pdfMappings && title) {
      const pdfSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Create hierarchical mapping only
      if (pageContext && pageContext.categorySlug && pageContext.pageSlug) {
        const hierarchicalKey = `${pageContext.categorySlug}/${pageContext.pageSlug}/${pdfSlug}`;
        pdfMappings[hierarchicalKey] = pdfUrl;
      }
    }
  }
  markdown += `>}}\n`;

  return markdown;
};

/**
 * Simplified fallback conversion for when the main converter fails
 */
const portableTextToMarkdownSimple = (blocks) => {
  return blocks
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children.map((child) => child.text || "").join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
};

/**
 * Extract plain text from portable text (useful for excerpts, descriptions)
 */
export const portableTextToPlainText = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children.map((child) => child.text || "").join("");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
};

/**
 * Extract first N words from portable text (useful for auto-generating excerpts)
 */
export const portableTextToExcerpt = (blocks, wordLimit = 30) => {
  const plainText = portableTextToPlainText(blocks);
  const words = plainText.split(/\s+/).filter(Boolean);

  if (words.length <= wordLimit) {
    return plainText;
  }

  return words.slice(0, wordLimit).join(" ") + "...";
};

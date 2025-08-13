# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hugo static site** with **Sanity CMS integration** for managing coloring pages. The site uses the **Blowfish theme** and is deployed on **Vercel**.

### Tech Stack

- **Hugo** (v0.143.0+) - Static site generator
- **Blowfish Theme** - Modern responsive theme (git submodule)
- **Sanity CMS** - Headless content management (Project: `zjqmnotc`, Dataset: `production`)
- **TypeScript/JavaScript** - Build scripts and utilities
- **Vercel** - Deployment and hosting
- **Resend** - Email API for forms and newsletters

## Development Commands

### Primary Commands

```bash
# Development workflow
npm run dev                    # Fetch content + start Hugo dev server
npm run build                  # Production build (fetch + Hugo build)
npm run preview               # Preview production build locally
npm run fetch-content-sections # Fetch latest content from Sanity CMS only

# Hugo-only commands (skip content fetching)
npm run build:hugo            # Build Hugo site without fetching content
hugo server -D                # Start Hugo dev server with drafts

# Code quality
npm run lint                  # ESLint check for scripts/
npm run lint:fix              # Auto-fix ESLint issues
npm run format                # Format code with Prettier
npm run format:check          # Check formatting without changes
npm run code-quality          # Run lint + format check
npm run code-quality:fix      # Fix lint + format issues

# Maintenance
npm run clean                 # Remove public/ and resources/ directories
```

### Sanity Studio

```bash
cd sanity
npm run dev                   # Start Sanity Studio (port 3333)
```

## Architecture & Content Flow

### Automated Content Pipeline

1. **Content Management** - Editors create content in Sanity Studio (`/sanity/`)
2. **Content Fetching** - Build script (`scripts/fetch-sanity-content-sections.js`) fetches from Sanity API
3. **Content Generation** - Converts Sanity documents to Hugo-compatible markdown files in `/content/`
4. **Image Optimization** - Applies Sanity CDN parameters for responsive images
5. **Static Generation** - Hugo builds final HTML to `/public/`
6. **Deployment** - Vercel serves the site globally

### Key Directories

- `/config/_default/` - Hugo configuration (theme params, menus, etc.)
- `/content/` - Generated Hugo content files (auto-generated, don't edit manually)
- `/scripts/` - Node.js build scripts for Sanity integration
- `/sanity/` - Sanity CMS configuration and schemas
- `/layouts/` - Custom Hugo layouts (overrides theme)
- `/assets/` - Processed assets (CSS, JS, images)
- `/static/` - Static assets served directly
- `/themes/blowfish/` - Blowfish theme (git submodule)
- `/api/` - Serverless functions for contact forms and newsletter

### Content Types

- **Coloring Pages** - Main content with categories and downloadable images
- **Categories** - Animal, Nature, Superheroes, etc. (section-based structure)
- **Pages** - Static pages (About, Contact, Privacy, etc.)
- **Posts** - Blog posts and articles

## Build Scripts & Utilities

### Primary Build Script

- `scripts/fetch-sanity-content-sections.js` - Main content fetching script
- Uses section-based structure for clean URLs
- Generates responsive images with Sanity CDN optimization
- Creates Hugo-compatible frontmatter and markdown content

### Utility Modules (`scripts/utils/`)

- `sanity-helpers.js` - Sanity client setup and connection testing
- `file-helpers.js` - File operations and markdown generation
- `image-helpers.js` - Image optimization and responsive image generation
- `portable-text-helpers.js` - Converts Sanity Portable Text to markdown

## Environment Variables

Required:

- `SANITY_PROJECT_ID=zjqmnotc`
- `SANITY_DATASET=production`
- `SANITY_TOKEN` - API token (in .env.example for reference)

Optional:

- `RESEND_API_KEY` - For contact forms and newsletter
- `HUGO_ENV` - Build environment
- Image optimization settings

## Image Optimization

The site automatically optimizes images from Sanity CDN:

- **Coloring Pages**: Main (1200x1200), thumbnail (800x800), small (200x200)
- **Categories**: Thumbnail (400x300), hero (1920x600)
- **Posts**: Hero (1920x600), thumbnail (800x800)
- Automatic WebP conversion for supported browsers
- Responsive srcset generation
- Dimensions stored in frontmatter for proper HTML rendering

## Theme Customization

- **Theme**: Blowfish (git submodule in `/themes/blowfish/`)
- **Custom layouts**: Override theme layouts in `/layouts/`
- **Assets**: Custom CSS/JS in `/assets/`
- **Configuration**: Theme params in `/config/_default/params.toml`

## API Endpoints (`/api/`)

Serverless functions for:

- Contact form submission (`/api/contact.js`)
- Newsletter subscription (`/api/newsletter.js`)
- Uses Resend API for email delivery
- Email templates in `/api/_templates/`

## Development Workflow

1. **Content changes**: Edit in Sanity Studio, then run `npm run fetch-content-sections`
2. **Code changes**: Edit layouts, assets, or scripts, then run `npm run dev`
3. **Theme updates**: `git submodule update --remote --merge`
4. **Production build**: `npm run build` (includes content fetching)

## Important Notes

- **Content files** in `/content/` are auto-generated - don't edit manually
- **Always fetch content** before building for production
- **Theme is a git submodule** - update carefully
- **Use section-based URLs** - content organized by Hugo sections
- **Images are CDN-optimized** - use generated URLs, not direct Sanity URLs

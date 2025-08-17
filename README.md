# Coloring Page Website

Hugo static site with Sanity CMS integration for managing coloring pages.

## Stack

- **Hugo** - Static site generator
- **Blowfish Theme** - Modern responsive theme
- **Sanity CMS** - Headless content management
- **TypeScript** - Type-safe development
- **Vercel** - Deployment and hosting

## Automation Workflow

The project uses an automated content pipeline:

1. **Content Management** - Editors create content in Sanity Studio
2. **Content Fetching** - Build process fetches from Sanity API
3. **Image Downloading** - Downloads and optimizes images locally
4. **Content Generation** - Converts to Hugo-compatible markdown files
5. **Static Generation** - Hugo builds the final HTML
6. **Deployment** - Vercel serves the site globally

This automation ensures:

- Fresh content on every build
- No manual content synchronization
- Local image optimization and caching
- Single command deployment (`npm run build`)

## Structure

- `/config/_default/` - Configuration directory (Hugo best practice)
- `/content/` - Content files
- `/themes/blowfish/` - Blowfish theme (git submodule)
- `/sanity/` - Sanity CMS configuration and schemas
- `/static/` - Static assets
- `/layouts/` - Custom layouts (overrides theme)
- `/assets/` - Processed assets (SCSS, JS, etc.)

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server (fetches content + starts Hugo)
npm run dev

# Start Sanity Studio (in separate terminal)
cd sanity && npm run dev
```

### Available Scripts

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Fetches Sanity content and starts Hugo dev server |
| `npm run build`         | Production build (fetches content + builds Hugo)  |
| `npm run preview`       | Preview production build locally                  |
| `npm run fetch-content` | Fetch latest content from Sanity CMS              |
| `npm run build:hugo`    | Build Hugo site only (without fetching)           |
| `npm run clean`         | Remove build artifacts (public/ and resources/)   |
| `npm run lint`          | Check code quality                                |
| `npm run format`        | Auto-format code                                  |
| `npm run test`          | Run tests (when configured)                       |

### Build Process

The build process automatically:

1. Fetches latest content from Sanity CMS
2. Generates Hugo-compatible markdown files with frontmatter
3. Optimizes images with CDN parameters
4. Builds the static site with Hugo

```bash
# Full production build
npm run build

# Clean build (remove old files first)
npm run clean && npm run build

# Update theme submodule
git submodule update --remote --merge
```

## Configuration

All configuration is in `/config/_default/`:

- `hugo.toml` - Main Hugo configuration
- `params.toml` - Theme parameters
- `menus.*.toml` - Menu configuration
- `languages.*.toml` - Language settings

## Image Optimization

The site automatically optimizes images from Sanity CDN for different contexts:

### Features

- **Automatic format conversion** - Serves WebP to supported browsers
- **Responsive images** - Multiple sizes for different devices
- **Smart sizing** - Predefined sizes for thumbnails, heroes, and content
- **SEO-friendly** - Includes dimensions to prevent layout shift (CLS)
- **Quality optimization** - Different quality levels based on image type

### Image Types

- **Coloring Pages**: Main (1200x1200), thumbnail (800x800), small (200x200)
- **Categories**: Thumbnail (400x300), hero (1920x600)
- **Posts**: Hero (1920x600), thumbnail (800x800)

### How It Works

1. Fetches image metadata from Sanity including dimensions
2. Generates optimized URLs with CDN parameters
3. Creates responsive srcset for modern browsers
4. Stores dimensions in frontmatter for proper HTML rendering

The optimization happens during build time in `scripts/fetch-sanity-content.js` using utilities from `scripts/utils/image-helpers.js`.

## PDF Proxy System

### Hierarchical PDF URLs

The site uses a Cloudflare Worker to serve PDFs with SEO-friendly hierarchical URLs instead of Sanity's hash-based URLs.

**Before:** `/pdf/teddy-bear.pdf` or `cdn.sanity.io/files/.../hash.pdf`  
**After:** `/mythical-creatures/robot-coloring-page/teddy-bear.pdf`

### PDF Workflow (Step-by-Step)

#### 1. Fetch Content & Generate PDF Mappings

```bash
# This fetches content from Sanity and creates PDF mappings
npm run fetch-content-sections

# Output: Creates/updates ./public/pdf-mappings.json with hierarchical mappings
# Example: "mythical-creatures/robot-coloring-page/teddy-bear": "https://cdn.sanity.io/..."
```

#### 2. Upload PDF Mappings to Cloudflare KV

```bash
# Navigate to the worker directory
cd cloudflare-workers/pdf-proxy

# Upload all PDF mappings to Cloudflare KV store
npm run upload-mappings

# This reads from ../../public/pdf-mappings.json
# Uploads each mapping to Cloudflare KV for the Worker to access
```

#### 3. Deploy the Worker (if changed)

```bash
# Still in cloudflare-workers/pdf-proxy directory
npx wrangler deploy

# This deploys the Worker code to Cloudflare's edge network
# Routes are configured to catch all PDF requests
```

### Complete PDF Update Process

When you add new PDFs or update content:

```bash
# Step 1: Fetch latest content and generate mappings
npm run fetch-content-sections

# Step 2: Upload new mappings to Cloudflare
cd cloudflare-workers/pdf-proxy && npm run upload-mappings

# Step 3: Build and deploy the site
cd ../.. && npm run build
```

### How It Works

1. **Content Creation**: PDFs are uploaded to Sanity CMS
2. **Mapping Generation**: Build script creates hierarchical URL mappings
3. **KV Storage**: Mappings are stored in Cloudflare's distributed KV store
4. **Request Handling**: Worker intercepts PDF requests and serves from Sanity CDN
5. **SEO Benefits**: Clean, hierarchical URLs that describe content structure

### Worker Configuration

- **Project**: `coloring-pages-pdf-proxy`
- **KV Namespace**: `PDF_MAPPINGS`
- **Routes**: Catches all `*.pdf` requests on the domain
- **Caching**: Edge cache for 24 hours, browser cache for 1 year

## Deployment

### Vercel Configuration

The site is deployed on Vercel with the following settings:

| Setting              | Value           |
| -------------------- | --------------- |
| **Build Command**    | `npm run build` |
| **Output Directory** | `public`        |
| **Install Command**  | `npm install`   |
| **Node Version**     | 18.x or higher  |

### Environment Variables

See `.env.example` for a complete list of all environment variables with descriptions.

**Required variables:**

- `SANITY_PROJECT_ID` - Your Sanity project ID (currently: zjqmnotc)
- `SANITY_DATASET` - Dataset name (usually: production)

**Optional variables:**

- `SANITY_TOKEN` - API token for private datasets
- `HUGO_ENV` - Build environment (development/production)
- Image optimization settings
- Feature flags
- Service integrations

**Setup:**

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Deployment Workflow

1. **Push to GitHub** - Triggers automatic deployment
2. **Vercel Build Process**:
   - Installs dependencies (`npm install`)
   - Fetches latest Sanity content
   - Builds Hugo static site
   - Deploys to CDN
3. **Content Updates** - Rebuild triggered via:
   - Git pushes
   - Manual redeploy in Vercel dashboard
   - Webhook from Sanity (when configured)

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy public/ folder to any static host
# The public/ folder contains the complete static site
```

## Documentation

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Blowfish Theme Documentation](https://blowfish.page/docs/)
- [Sanity Documentation](https://www.sanity.io/docs)

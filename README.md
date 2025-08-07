# Coloring Page Website

Hugo static site with Sanity CMS integration for managing coloring pages.

## Stack

- **Hugo** - Static site generator
- **Blowfish Theme** - Modern responsive theme
- **Sanity CMS** - Headless content management
- **TypeScript** - Type-safe development

## Structure

- `/config/_default/` - Configuration directory (Hugo best practice)
- `/content/` - Content files
- `/themes/blowfish/` - Blowfish theme (git submodule)
- `/sanity/` - Sanity CMS configuration and schemas
- `/static/` - Static assets
- `/layouts/` - Custom layouts (overrides theme)
- `/assets/` - Processed assets (SCSS, JS, etc.)

## Quick Start

```bash
# Start development server
hugo server -D

# Start Sanity Studio
cd sanity && npm run dev

# Build site
hugo

# Update theme
git submodule update --remote --merge
```

## Configuration

All configuration is in `/config/_default/`:
- `hugo.toml` - Main Hugo configuration
- `params.toml` - Theme parameters
- `menus.*.toml` - Menu configuration
- `languages.*.toml` - Language settings

## Documentation

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Blowfish Theme Documentation](https://blowfish.page/docs/)
- [Sanity Documentation](https://www.sanity.io/docs)

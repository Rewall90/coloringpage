# Hugo Site with Blowfish Theme

This Hugo site uses the Blowfish theme and follows Hugo best practices.

## Structure

- `/config/_default/` - Configuration directory (Hugo best practice)
- `/content/` - Content files
- `/themes/blowfish/` - Blowfish theme (git submodule)
- `/static/` - Static assets
- `/layouts/` - Custom layouts (overrides theme)
- `/assets/` - Processed assets (SCSS, JS, etc.)

## Quick Start

```bash
# Start development server
hugo server -D

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
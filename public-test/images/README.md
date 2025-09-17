# Homepage Image Instructions

## How to Add Your Homepage Hero Image

1. **Add your image to this directory** (`/static/images/`)
   - Name it: `homepage-hero.jpg` (or `.webp`, `.png`)
   - Recommended size: 800x600px minimum
   - Recommended format: WebP for best performance, JPG as fallback

2. **Update the configuration** if using a different filename:
   - Edit `/config/_default/params.toml`
   - Update the `homepageImage` path under `[homepage]`

## Current Configuration
```toml
[homepage]
  layout = "card"
  homepageImage = "/images/homepage-hero.jpg"
```

## Supported Image Formats
- WebP (recommended - best compression)
- JPG/JPEG (good for photos)
- PNG (good for graphics with transparency)

## Tips
- The image will appear in the right column of your homepage
- On mobile, it will stack below your content
- Keep file size under 500KB for optimal performance
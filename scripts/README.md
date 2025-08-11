# Hugo + Sanity Build Scripts

This directory contains build scripts for integrating Sanity CMS with Hugo static site generation.

## Files

- **`fetch-sanity-content.js`** - Main script that fetches content from Sanity and generates Hugo markdown files
- **`utils/sanity-helpers.js`** - Sanity client utilities and environment validation
- **`utils/file-helpers.js`** - File operations and markdown generation utilities

## Usage

### Prerequisites

1. Install dependencies:
   ```bash
   npm install @sanity/client js-yaml dotenv
   ```

2. Set up environment variables (create `.env.local`):
   ```bash
   SANITY_PROJECT_ID=your_project_id
   SANITY_DATASET=production
   SANITY_TOKEN=your_token_if_needed  # Optional, for private datasets
   ```

### Running the Script

```bash
# Direct execution
node scripts/fetch-sanity-content.js

# Or via npm script (after updating package.json)
npm run fetch-content
npm run build     # Fetches content + builds Hugo site
npm run dev       # Fetches content + starts Hugo dev server
```

## What it Does

1. **Validates Environment** - Checks for required environment variables
2. **Tests Connection** - Verifies connection to Sanity CMS
3. **Fetches Content** - Retrieves all content types via GROQ queries
4. **Generates Files** - Creates Hugo-compatible markdown files with YAML frontmatter

### Content Types Generated

| Sanity Type | Output Directory | Hugo Purpose |
|-------------|------------------|--------------|
| `post` | `/content/posts/` | Blog posts |
| `page` | `/content/pages/` | Static pages (about, contact, etc.) |
| `category` | `/content/categories/` | Taxonomy pages |
| `coloringPage` | `/content/coloring-pages/` | Individual coloring pages |

### Safety Features

- **Zombie Content Prevention** - Cleans output directories before generation
- **Collision Detection** - Handles duplicate slugs automatically
- **Input Validation** - Skips invalid content with detailed logging
- **Safe YAML Generation** - Uses js-yaml to prevent injection attacks
- **Error Recovery** - Individual item failures don't crash entire build

### Performance Features

- **Parallel Processing** - All content types are fetched and generated simultaneously
- **Build Time Reporting** - Shows generation duration for performance monitoring
- **Optimized GROQ Queries** - Fetch only required fields to minimize API calls

## Build Pipeline Integration

### Vercel
Add to `vercel.json`:
```json
{
  "buildCommand": "npm install && npm run build"
}
```

### Netlify
Add to `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "public"
```

### Manual Deployment
```bash
npm run build
# Upload 'public' directory to your hosting provider
```

## Environment Variables by Platform

### Local Development
Create `.env.local`:
```bash
SANITY_PROJECT_ID=zjqmnotc
SANITY_DATASET=production
```

### Vercel
```bash
vercel env add SANITY_PROJECT_ID
vercel env add SANITY_DATASET
```

### Netlify
Set in Site settings > Environment variables

### GitHub Actions
Set in repository Settings > Secrets and variables > Actions

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check that SANITY_PROJECT_ID and SANITY_DATASET are set
   - Verify .env.local file exists and has correct values

2. **"Connection test failed"**
   - Verify project ID and dataset name are correct
   - Check if dataset is private (needs SANITY_TOKEN)
   - Confirm internet connection

3. **"No content generated"**
   - Verify content exists in Sanity Studio
   - Check that schema types are published
   - Ensure coloringPage is a 'document' not 'object' type

4. **Build fails on deployment**
   - Confirm environment variables are set on hosting platform
   - Check Node.js version compatibility (requires Node 14.8+)
   - Verify all npm dependencies are in package.json

### Debug Mode
Add debug output by setting:
```bash
DEBUG=true node scripts/fetch-sanity-content.js
```

## Code Quality

The project includes comprehensive linting and formatting tools:

### Available Commands

```bash
# Check code quality (linting + formatting)
npm run code-quality

# Fix code quality issues automatically
npm run code-quality:fix

# Linting only
npm run lint          # Check for issues
npm run lint:fix      # Fix automatically

# Formatting only  
npm run format        # Format all files
npm run format:check  # Check formatting
```

### Tools Used

- **ESLint** - Code quality and error detection
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks for pre-commit quality checks

### IDE Setup

For VS Code users, the `.vscode/settings.json` file automatically:
- Formats code on save
- Runs ESLint fixes on save
- Sets up proper file associations

### Pre-commit Hooks

Code quality checks run automatically before each commit to maintain consistency.

## Contributing

When modifying scripts:
1. Run `npm run code-quality:fix` before committing
2. Test locally first
3. Update this README if adding new features
4. Follow existing error handling patterns
5. Add logging for new operations
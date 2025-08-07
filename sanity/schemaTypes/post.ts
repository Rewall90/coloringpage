import {defineField, defineType} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // Main Content Fields
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'content',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Post Description',
      type: 'text',
      group: 'content',
      description: 'Brief summary shown in post listings and under the title',
      rows: 3,
    }),
    
    // Mixed Content Array - The Magic Happens Here!
    defineField({
      name: 'content',
      title: 'Post Content',
      type: 'array',
      group: 'content',
      description: 'Add text blocks and coloring pages in any order',
      of: [
        // Rich text blocks
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                  },
                  {
                    title: 'Open in new tab',
                    name: 'blank',
                    type: 'boolean',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        },
        // Coloring page objects
        {
          type: 'coloringPage',
        },
        // Regular images (for non-coloring content)
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              validation: (rule) => rule.required(),
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
          ],
        },
      ],
    }),

    // Settings
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'settings',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      group: 'settings',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'settings',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Post',
      type: 'boolean',
      group: 'settings',
      description: 'Feature this post on the homepage',
      initialValue: false,
    }),

    // SEO Fields (same pattern as category and page)
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
      description: 'Title tag for search engines (50-60 characters recommended)',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      group: 'seo',
      description: 'Meta description for search engines (150-160 characters)',
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'string',
      group: 'seo',
      description: 'Title for social media sharing (can differ from SEO title)',
    }),
    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'text',
      group: 'seo',
      description: 'Description for social media sharing',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
      description: '1200x630 recommended for social media sharing',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'preventIndexing',
      title: 'Prevent Search Engine Indexing',
      type: 'boolean',
      group: 'seo',
      description: 'Check this to add noindex meta tag',
      initialValue: false,
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      group: 'seo',
      description: 'Optional - override the default canonical URL',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author',
      media: 'heroImage',
      category: 'category.title',
    },
    prepare(selection) {
      const {title, author, media, category} = selection
      return {
        title,
        subtitle: category ? `${category} • ${author || 'No author'}` : author,
        media,
      }
    },
  },
})
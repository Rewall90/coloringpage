import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // Content Fields
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
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
      rows: 4,
    }),
    defineField({
      name: 'categoryImage',
      title: 'Category Image',
      type: 'image',
      group: 'content',
      description: '600x800 recommended for thumbnails',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for accessibility and SEO',
          validation: (rule) => rule.required(),
        },
      ],
    }),

    // Hierarchy & Ordering
    defineField({
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      group: 'settings',
      to: [{type: 'category'}],
      description: 'Optional - leave blank for main categories',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      group: 'settings',
      description: 'Lower numbers appear first (1, 2, 3...)',
    }),

    // SEO & Metadata
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
      media: 'categoryImage',
      subtitle: 'description',
    },
  },
})
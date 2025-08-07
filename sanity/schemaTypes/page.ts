import {defineField, defineType} from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'pageSettings', title: 'Page Settings'},
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
      name: 'pageType',
      title: 'Page Type',
      type: 'string',
      group: 'pageSettings',
      options: {
        list: [
          {title: 'About', value: 'about'},
          {title: 'Contact', value: 'contact'},
          {title: 'Privacy Policy', value: 'privacy'},
          {title: 'Terms of Service', value: 'terms'},
          {title: 'Terms & Conditions', value: 'termsConditions'},
          {title: 'Licensing Policy', value: 'licensing'},
          {title: 'Takedown Policy', value: 'takedown'},
          {title: 'FAQ', value: 'faq'},
          {title: 'Generic', value: 'generic'},
        ],
        layout: 'radio',
      },
      initialValue: 'generic',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      description: 'Brief summary of the page content',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
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
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'content',
      description: 'Optional hero image for the page header',
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

    // Contact Page Specific Fields
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      group: 'pageSettings',
      description: 'Only fill this if Page Type is Contact',
      fields: [
        {
          name: 'email',
          title: 'Email',
          type: 'string',
        },
        {
          name: 'phone',
          title: 'Phone',
          type: 'string',
        },
        {
          name: 'address',
          title: 'Address',
          type: 'text',
          rows: 3,
        },
        {
          name: 'businessHours',
          title: 'Business Hours',
          type: 'text',
          rows: 3,
        },
      ],
      hidden: ({document}) => document?.pageType !== 'contact',
    }),

    // Privacy/Terms Specific Fields
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      group: 'pageSettings',
      description: 'When this page was last updated (for legal pages)',
      hidden: ({document}) => !['privacy', 'terms', 'termsConditions', 'licensing', 'takedown'].includes(document?.pageType as string),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      group: 'pageSettings',
      description: 'When this policy became effective',
      hidden: ({document}) => !['privacy', 'terms', 'termsConditions', 'licensing', 'takedown'].includes(document?.pageType as string),
    }),

    // SEO & Metadata (same as category)
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
      subtitle: 'pageType',
      media: 'heroImage',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title,
        subtitle: subtitle ? `${subtitle.charAt(0).toUpperCase() + subtitle.slice(1)} Page` : 'Page',
        media,
      }
    },
  },
})
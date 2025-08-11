import {defineField, defineType} from 'sanity'

export const coloringPage = defineType({
  name: 'coloringPage',
  title: 'Coloring Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
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
      rows: 2,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'category'}],
        },
      ],
      validation: (rule) => rule.min(1).required().error('At least one category is required'),
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          {title: 'Easy', value: 'easy'},
          {title: 'Medium', value: 'medium'},
          {title: 'Hard', value: 'hard'},
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
      initialValue: 'medium',
    }),
    defineField({
      name: 'image',
      title: 'Coloring Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for SEO and accessibility',
          validation: (rule) => rule.required(),
        },
      ],
    }),
    defineField({
      name: 'pdfFile',
      title: 'PDF File',
      type: 'file',
      description: 'The downloadable PDF for this coloring page',
      options: {
        accept: 'application/pdf',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'metadata',
      title: 'Filtering Metadata',
      type: 'object',
      description: 'Optional - only for items that need filtering (e.g., flags, animals by type)',
      fields: [
        {
          name: 'continent',
          title: 'Continent',
          type: 'string',
          options: {
            list: [
              {title: 'Africa', value: 'africa'},
              {title: 'Asia', value: 'asia'},
              {title: 'Europe', value: 'europe'},
              {title: 'North America', value: 'northAmerica'},
              {title: 'South America', value: 'southAmerica'},
              {title: 'Oceania', value: 'oceania'},
              {title: 'Antarctica', value: 'antarctica'},
            ],
          },
        },
        {
          name: 'country',
          title: 'Country',
          type: 'string',
          description: 'Country name for flags',
        },
        {
          name: 'category',
          title: 'Sub-category',
          type: 'string',
          description: 'For categorizing within a post (e.g., mammals, birds, reptiles)',
        },
        {
          name: 'tags',
          title: 'Tags',
          type: 'array',
          of: [{type: 'string'}],
          options: {
            layout: 'tags',
          },
          description: 'Additional tags for filtering',
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
})
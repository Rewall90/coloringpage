import {defineField, defineType} from 'sanity'

export const pinterestBoard = defineType({
  name: 'pinterestBoard',
  title: 'Pinterest Board',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Board Name',
      type: 'string',
      description: 'The exact name of your Pinterest board',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'boardId',
      title: 'Board ID',
      type: 'string',
      description: 'Pinterest Board ID for API calls (optional)',
    }),
    defineField({
      name: 'description',
      title: 'Board Description',
      type: 'text',
      rows: 2,
      description: 'Description of what content goes on this board',
    }),
    defineField({
      name: 'category',
      title: 'Board Category',
      type: 'string',
      options: {
        list: [
          {title: 'DIY and Crafts', value: 'diy_and_crafts'},
          {title: 'Education', value: 'education'},
          {title: 'Kids and Parenting', value: 'kids_and_parenting'},
          {title: 'Art', value: 'art'},
          {title: 'Entertainment', value: 'entertainment'},
          {title: 'Holidays and Events', value: 'holidays_and_events'},
        ],
      },
      description: 'Pinterest category for better discoverability',
    }),
    defineField({
      name: 'isActive',
      title: 'Active Board',
      type: 'boolean',
      description: 'Uncheck to hide from selection (for archived boards)',
      initialValue: true,
    }),
    defineField({
      name: 'defaultHashtags',
      title: 'Default Hashtags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
      description: 'Default hashtags that are always added to pins on this board',
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes about this board strategy or content guidelines',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {title, subtitle, isActive} = selection
      return {
        title: `${isActive ? '📌' : '🔒'} ${title}`,
        subtitle: subtitle || 'Pinterest Board',
      }
    },
  },

  orderings: [
    {
      title: 'Board Name',
      name: 'title',
      by: [{field: 'title', direction: 'asc'}],
    },
    {
      title: 'Active First',
      name: 'activeFirst',
      by: [
        {field: 'isActive', direction: 'desc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
})
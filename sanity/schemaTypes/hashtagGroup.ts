import {defineField, defineType} from 'sanity'

export const hashtagGroup = defineType({
  name: 'hashtagGroup',
  title: 'Hashtag Group',
  type: 'document',
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Group Name',
      type: 'string',
      description: 'Internal name for this hashtag group (e.g., "Venom Hashtags", "Kids Coloring")',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Primary Platform',
      type: 'string',
      options: {
        list: [
          {title: 'Instagram', value: 'instagram'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Pinterest', value: 'pinterest'},
          {title: 'Universal', value: 'universal'},
        ],
        layout: 'radio',
      },
      description: 'Which platform this hashtag group is optimized for',
      initialValue: 'universal',
    }),
    defineField({
      name: 'hashtags',
      title: 'Hashtags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
      description: 'Hashtags without the # symbol',
      validation: (rule) => rule.required().min(1).max(30).custom((hashtags, context) => {
        if (hashtags) {
          // Check for # symbols
          const withHashtags = hashtags.filter(tag => tag?.startsWith('#'))
          if (withHashtags.length > 0) {
            return 'Remove the # symbol from hashtags'
          }
          
          // Platform specific validation
          if (context.document?.platform === 'instagram' && hashtags.length > 30) {
            return 'Instagram allows maximum 30 hashtags'
          }
        }
        return true
      }),
    }),
    defineField({
      name: 'category',
      title: 'Content Category',
      type: 'string',
      options: {
        list: [
          {title: 'General Coloring', value: 'general'},
          {title: 'Themed Collections', value: 'themed'},
          {title: 'Holiday/Seasonal', value: 'seasonal'},
          {title: 'Educational', value: 'educational'},
          {title: 'Characters/Movies', value: 'characters'},
          {title: 'Promotional', value: 'promotional'},
        ],
      },
      description: 'What type of content this hashtag group is for',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Notes about when to use this hashtag group',
    }),
    defineField({
      name: 'isActive',
      title: 'Active Group',
      type: 'boolean',
      description: 'Uncheck to hide from selection (for outdated hashtag sets)',
      initialValue: true,
    }),
    defineField({
      name: 'engagement',
      title: 'Performance Notes',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'averageReach',
          title: 'Average Reach',
          type: 'number',
          description: 'Average reach when using this hashtag group',
        },
        {
          name: 'bestPerformingTags',
          title: 'Best Performing Tags',
          type: 'array',
          of: [{type: 'string'}],
          options: {layout: 'tags'},
          description: 'Which hashtags in this group perform best',
        },
        {
          name: 'notes',
          title: 'Performance Notes',
          type: 'text',
          rows: 2,
        },
        {
          name: 'lastUpdated',
          title: 'Last Performance Review',
          type: 'date',
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: 'internalTitle',
      platform: 'platform',
      category: 'category',
      hashtagCount: 'hashtags',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {title, platform, category, hashtagCount, isActive} = selection
      const platformEmojis = {
        instagram: '📷',
        facebook: '👥',
        pinterest: '📌',
        universal: '🌐',
      }
      const count = Array.isArray(hashtagCount) ? hashtagCount.length : 0
      return {
        title: `${isActive ? '' : '🔒 '}${title}`,
        subtitle: `${platformEmojis[platform] || ''} ${platform} • ${count} hashtags ${category ? `• ${category}` : ''}`,
      }
    },
  },

  orderings: [
    {
      title: 'Group Name',
      name: 'title',
      by: [{field: 'internalTitle', direction: 'asc'}],
    },
    {
      title: 'Platform, then Name',
      name: 'platformName',
      by: [
        {field: 'platform', direction: 'asc'},
        {field: 'internalTitle', direction: 'asc'},
      ],
    },
    {
      title: 'Active First',
      name: 'activeFirst',
      by: [
        {field: 'isActive', direction: 'desc'},
        {field: 'internalTitle', direction: 'asc'},
      ],
    },
  ],
})
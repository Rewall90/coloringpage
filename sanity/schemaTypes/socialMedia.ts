import {defineField, defineType} from 'sanity'

export const socialMedia = defineType({
  name: 'socialMedia',
  title: 'Social Media Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'scheduling', title: 'Scheduling & Status'},
    {name: 'analytics', title: 'Analytics'},
  ],
  fields: [
    // Common Fields for All Posts
    defineField({
      name: 'internalTitle',
      title: 'Internal Title',
      type: 'string',
      group: 'content',
      description: 'For identifying this campaign in Sanity (e.g., "Venom Promotion - August 2025")',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Instagram', value: 'instagram'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Pinterest', value: 'pinterest'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'postType',
      title: 'Post Type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Single Image', value: 'singleImage'},
          {title: 'Image Collection', value: 'imageCollection'},
          {title: 'Content Promotion', value: 'contentPromotion'},
          {title: 'Carousel', value: 'carousel'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'campaign',
      title: 'Campaign',
      type: 'string',
      group: 'content',
      description: 'Group related posts (e.g., "Back to School 2025", "Halloween Collection")',
    }),

    // Single Image Post Fields
    defineField({
      name: 'singleImage',
      title: 'Image',
      type: 'image',
      group: 'content',
      description: 'The single image to be posted',
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
      hidden: ({document}) => document?.postType !== 'singleImage',
      validation: (rule) => rule.custom((image, context) => {
        if (context.document?.postType === 'singleImage' && !image) {
          return 'Image is required for single image posts'
        }
        return true
      }),
    }),
    defineField({
      name: 'caption',
      title: 'Caption/Text',
      type: 'text',
      group: 'content',
      rows: 4,
      description: 'The text content for this post',
      hidden: ({document}) => document?.postType !== 'singleImage',
    }),

    // Carousel Post Fields
    defineField({
      name: 'carouselImages',
      title: 'Carousel Images',
      type: 'array',
      group: 'content',
      of: [
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
              title: 'Image Caption',
              type: 'text',
              rows: 2,
            },
          ],
        },
      ],
      hidden: ({document}) => document?.postType !== 'carousel',
      validation: (rule) => rule.custom((images, context) => {
        if (context.document?.postType === 'carousel') {
          if (!images || images.length < 2) {
            return 'At least 2 images required for carousel posts'
          }
          if (images.length > 10) {
            return 'Maximum 10 images allowed for carousel posts'
          }
        }
        return true
      }),
    }),
    defineField({
      name: 'carouselCaption',
      title: 'Carousel Caption',
      type: 'text',
      group: 'content',
      rows: 4,
      description: 'Main caption for the carousel post',
      hidden: ({document}) => document?.postType !== 'carousel',
    }),

    // Content Promotion Fields
    defineField({
      name: 'promotedPost',
      title: 'Post to Promote',
      type: 'reference',
      group: 'content',
      to: [{type: 'post'}],
      description: 'Reference to existing post to promote',
      hidden: ({document}) => document?.postType !== 'contentPromotion',
      validation: (rule) => rule.custom((ref, context) => {
        if (context.document?.postType === 'contentPromotion' && !ref) {
          return 'Post reference is required for content promotion'
        }
        return true
      }),
    }),
    defineField({
      name: 'promotionText',
      title: 'Promotion Text Template',
      type: 'text',
      group: 'content',
      rows: 4,
      description: 'Promotion text with template variables. Use {{post.title}}, {{post.excerpt}}, {{post.category.title}}, {{post.author}}',
      placeholder: 'Check out our latest post: "{{post.title}}" 🎨\n\n{{post.excerpt}}\n\nFrom our {{post.category.title}} collection. Perfect for kids and adults!\n\n#coloringpages #{{post.category.title}}',
      hidden: ({document}) => document?.postType !== 'contentPromotion',
    }),

    // Image Collection Fields (Pinterest)
    defineField({
      name: 'sourceCategory',
      title: 'Source Category',
      type: 'reference',
      group: 'content',
      to: [{type: 'category'}],
      description: 'Category to pull coloring pages from',
      hidden: ({document}) => document?.postType !== 'imageCollection',
      validation: (rule) => rule.custom((ref, context) => {
        if (context.document?.postType === 'imageCollection' && !ref) {
          return 'Source category is required for image collections'
        }
        return true
      }),
    }),
    defineField({
      name: 'pinDescriptionTemplate',
      title: 'Pin Description Template',
      type: 'text',
      group: 'content',
      rows: 4,
      description: 'Template for pin descriptions. Use {{title}}, {{category}}, {{difficulty}} variables',
      placeholder: 'Check out our new coloring page for {{title}} from the {{category}} collection! Get your free PDF. #coloringpage #{{category}} #{{title}}',
      hidden: ({document}) => document?.postType !== 'imageCollection',
    }),
    defineField({
      name: 'maxImages',
      title: 'Maximum Images to Post',
      type: 'number',
      group: 'content',
      description: 'How many images from the category to post (default: 25)',
      initialValue: 25,
      validation: (rule) => rule.min(1).max(100),
      hidden: ({document}) => document?.postType !== 'imageCollection',
    }),

    // Platform-Specific Metadata
    defineField({
      name: 'hashtagGroups',
      title: 'Hashtag Groups',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'reference',
          to: [{type: 'hashtagGroup'}],
          options: {
            filter: ({document}) => {
              if (!document?.platform) return {}
              return {
                filter: 'platform == $platform || platform == "universal"',
                params: {platform: document.platform}
              }
            }
          }
        }
      ],
      description: 'Select hashtag groups to combine for this post',
    }),
    defineField({
      name: 'additionalHashtags',
      title: 'Additional Hashtags',
      type: 'array',
      group: 'content',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
      description: 'Extra hashtags specific to this post (without # symbol)',
      validation: (rule) => rule.custom((hashtags, context) => {
        if (hashtags && context.document?.platform === 'instagram') {
          // Note: Total validation with groups happens in automation script
          return hashtags.length <= 30 ? true : 'Keep additional hashtags reasonable (automation will validate total)'
        }
        return true
      }),
    }),
    defineField({
      name: 'pinterestBoard',
      title: 'Pinterest Board',
      type: 'reference',
      group: 'content',
      to: [{type: 'pinterestBoard'}],
      options: {
        filter: 'isActive == true'
      },
      description: 'Target Pinterest board',
      hidden: ({document}) => document?.platform !== 'pinterest',
    }),

    // Scheduling & Status
    defineField({
      name: 'scheduledFor',
      title: 'Scheduled For',
      type: 'datetime',
      group: 'scheduling',
      description: 'When this should be posted',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'scheduling',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Scheduled', value: 'scheduled'},
          {title: 'Posting', value: 'posting'},
          {title: 'Posted', value: 'posted'},
          {title: 'Failed', value: 'failed'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'postUrl',
      title: 'Post URL',
      type: 'url',
      group: 'scheduling',
      description: 'URL of the posted content (filled by automation)',
      readOnly: true,
    }),
    defineField({
      name: 'postedAt',
      title: 'Posted At',
      type: 'datetime',
      group: 'scheduling',
      description: 'When this was actually posted (filled by automation)',
      readOnly: true,
    }),
    defineField({
      name: 'errorMessage',
      title: 'Error Message',
      type: 'text',
      group: 'scheduling',
      description: 'Error details if posting failed (filled by automation)',
      readOnly: true,
      rows: 3,
    }),
    defineField({
      name: 'attemptCount',
      title: 'Attempt Count',
      type: 'number',
      group: 'scheduling',
      description: 'Number of posting attempts (filled by automation)',
      readOnly: true,
      initialValue: 0,
    }),

    // Analytics
    defineField({
      name: 'performance',
      title: 'Performance Metrics',
      type: 'object',
      group: 'analytics',
      readOnly: true,
      fields: [
        {
          name: 'likes',
          title: 'Likes',
          type: 'number',
        },
        {
          name: 'shares',
          title: 'Shares',
          type: 'number',
        },
        {
          name: 'comments',
          title: 'Comments',
          type: 'number',
        },
        {
          name: 'clicks',
          title: 'Clicks',
          type: 'number',
        },
        {
          name: 'impressions',
          title: 'Impressions',
          type: 'number',
        },
        {
          name: 'lastUpdated',
          title: 'Metrics Last Updated',
          type: 'datetime',
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      group: 'analytics',
      rows: 3,
      description: 'Internal notes about this post performance or strategy',
    }),
  ],

  preview: {
    select: {
      title: 'internalTitle',
      platform: 'platform',
      postType: 'postType',
      status: 'status',
      media: 'singleImage',
    },
    prepare(selection) {
      const {title, platform, postType, status, media} = selection
      const platformEmojis = {
        instagram: '📷',
        facebook: '👥',
        pinterest: '📌',
      }
      const statusEmojis = {
        draft: '📝',
        scheduled: '⏰',
        posting: '🔄',
        posted: '✅',
        failed: '❌',
      }
      return {
        title,
        subtitle: `${platformEmojis[platform] || ''} ${platform} • ${postType} • ${statusEmojis[status] || ''} ${status}`,
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Scheduled Date',
      name: 'scheduledDate',
      by: [{field: 'scheduledFor', direction: 'asc'}],
    },
    {
      title: 'Status, then Date',
      name: 'statusDate',
      by: [
        {field: 'status', direction: 'asc'},
        {field: 'scheduledFor', direction: 'asc'},
      ],
    },
    {
      title: 'Campaign, then Date',
      name: 'campaignDate',
      by: [
        {field: 'campaign', direction: 'asc'},
        {field: 'scheduledFor', direction: 'asc'},
      ],
    },
  ],
})
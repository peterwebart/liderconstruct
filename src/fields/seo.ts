import type { Field } from 'payload'

/**
 * Reusable SEO group. Title/description are localized (RO/RU). ogImage feeds
 * Open Graph + Twitter cards; noIndex toggles the robots meta.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: { position: 'sidebar' },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      admin: { description: 'Defaults to the item name if left blank (~60 chars).' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      admin: { description: '~155 characters.' },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Social share image (Open Graph / Twitter).' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Hide this page from search engines.' },
    },
  ],
}

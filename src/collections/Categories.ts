import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { TAXONOMY_LEVELS } from '../lib/constants'

/**
 * Internal business taxonomy, independent of any supplier:
 * Section -> Category -> Subcategory -> Product Family (-> Product).
 * Self-nested via `parent` + `level`. Supplier category strings are mapped in
 * here via `aliases` (one internal node may collect many supplier categories).
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Taxonomy node', plural: 'Taxonomy' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'level', 'parent', 'featured', 'displayOrder'],
    group: 'Catalog',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Taxonomy',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true, index: true },
            slugField('title'),
            {
              name: 'level',
              type: 'select',
              required: true,
              options: [...TAXONOMY_LEVELS],
              admin: { position: 'sidebar' },
            },
            {
              name: 'parent',
              type: 'relationship',
              relationTo: 'categories',
              index: true,
              admin: { position: 'sidebar', description: 'The node one level up. Empty for a Section.' },
            },
            {
              name: 'aliases',
              type: 'text',
              hasMany: true,
              admin: { description: 'Supplier category strings that map to this node.' },
            },
          ],
        },
        {
          label: 'Page',
          fields: [
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            { name: 'icon', type: 'text', admin: { description: 'Icon name for tiles/nav.' } },
            { name: 'description', type: 'richText', localized: true },
            {
              name: 'buyingGuide',
              type: 'richText',
              localized: true,
              admin: { description: 'Editorial buying guide shown on the category page.' },
            },
            {
              name: 'faqs',
              type: 'array',
              labels: { singular: 'FAQ', plural: 'FAQs' },
              fields: [
                { name: 'question', type: 'text', localized: true, required: true },
                { name: 'answer', type: 'textarea', localized: true, required: true },
              ],
            },
            {
              name: 'featuredProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Eligible for homepage Featured Categories.' },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    seoField,
  ],
}

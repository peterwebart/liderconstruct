import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

/** Brands are first-class entities with their own landing pages. */
export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'featured', 'displayOrder'],
    group: 'Catalog',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true, index: true }, // proper noun — not localized
    slugField('name'),
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Merged', value: 'merged' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'text',
      admin: { position: 'sidebar', description: 'Provenance, e.g. "import:liderconstruct-2024-05".' },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'banner', type: 'upload', relationTo: 'media', admin: { description: 'Brand page hero banner.' } },
    { name: 'description', type: 'richText', localized: true },
    { name: 'country', type: 'text' },
    { name: 'website', type: 'text' },
    {
      name: 'catalogues',
      type: 'array',
      labels: { singular: 'Catalogue', plural: 'Catalogues' },
      admin: { description: 'Downloadable brand catalogues / price lists (PDF).' },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'file', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: { description: 'Supplier brand strings mapping here (e.g. "Euro As", "Euro AS").' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Eligible for the homepage Top Brands section.' },
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

import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

/**
 * Manufacturer — a distinct business entity from Brand (a brand may be made by
 * a different manufacturer; future suppliers may require both). Not present in
 * today's data; schema created now per the Phase-2 brief.
 */
export const Manufacturers: CollectionConfig = {
  slug: 'manufacturers',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'country'], group: 'Catalog' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    slugField('name'),
    { name: 'country', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: { description: 'Supplier-provided manufacturer names that map here.' },
    },
    seoField,
  ],
}

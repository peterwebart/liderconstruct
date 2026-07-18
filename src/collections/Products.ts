import type { CollectionConfig } from 'payload'

import { authenticated, readPublished } from '../access'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { ASSET_TYPES, PRODUCT_LIFECYCLE } from '../lib/constants'

/**
 * A product groups one or more priced Variations (sold by SKU). Product-level
 * attributes are stored by registry `key` (nothing hard-coded); variation-
 * defining attributes live on Variations. Drafts enabled for Flow B review.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'brand', 'lifecycle', '_status', 'updatedAt'],
    group: 'Catalog',
    preview: (doc) => (typeof doc?.slug === 'string' ? `/produs/${doc.slug}` : null),
  },
  versions: { drafts: { autosave: { interval: 375 } }, maxPerDoc: 20 },
  access: { read: readPublished, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true, index: true },
            slugField('title'),
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              admin: { description: 'Card text + meta description fallback.' },
            },
            { name: 'description', type: 'richText', localized: true },
            {
              name: 'applicationArea',
              type: 'textarea',
              localized: true,
              admin: { description: 'Domeniu de aplicare / Область применения.' },
            },
          ],
        },
        {
          label: 'Specifications',
          fields: [
            {
              name: 'attributes',
              type: 'array',
              labels: { singular: 'Specification', plural: 'Specifications' },
              admin: {
                description: 'Registry-driven. `key` references an Attribute; behaviour (filterable, etc.) comes from the registry.',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'key', type: 'text', required: true, index: true },
                    { name: 'value', type: 'text', required: true, localized: true },
                  ],
                },
                {
                  name: 'numericValue',
                  type: 'number',
                  admin: { description: 'Parsed numeric value for range filters/sorting (optional).' },
                },
              ],
            },
            {
              name: 'unit',
              type: 'relationship',
              relationTo: 'units',
              admin: { position: 'sidebar', description: 'Default unit of sale.' },
            },
            { name: 'countryOfOrigin', type: 'text', admin: { position: 'sidebar' } },
            // Future-ready, nullable; not populated from today's data.
            { name: 'barcode', type: 'text', index: true, admin: { position: 'sidebar' } },
            { name: 'netWeight', type: 'number', admin: { position: 'sidebar', description: 'kg (future).' } },
            { name: 'netVolume', type: 'number', admin: { position: 'sidebar', description: 'litres (future).' } },
            { name: 'certifications', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
          ],
        },
        {
          label: 'Media',
          fields: [
            { name: 'primaryImage', type: 'upload', relationTo: 'media' },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
            {
              name: 'assets',
              type: 'array',
              labels: { singular: 'Asset', plural: 'Assets' },
              admin: { description: 'Installation/lifestyle images, technical drawings, PDFs, BIM (future).' },
              fields: [
                { name: 'type', type: 'select', required: true, options: [...ASSET_TYPES] },
                { name: 'file', type: 'upload', relationTo: 'media' },
                { name: 'label', type: 'text', localized: true },
              ],
            },
          ],
        },
        {
          label: 'Variations',
          fields: [
            {
              name: 'variations',
              type: 'join',
              collection: 'variations',
              on: 'product',
              admin: { description: 'Priced variations (SKU). Managed in the Variations collection.' },
            },
          ],
        },
        {
          label: 'Relationships',
          description: 'Schema-ready for the future recommendation engine. Populated later.',
          fields: [
            { name: 'frequentlyBoughtTogether', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'similarProducts', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'betterAlternatives', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'premiumAlternatives', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'budgetAlternatives', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'compatibleProducts', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'accessories', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'consumables', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'replacementParts', type: 'relationship', relationTo: 'products', hasMany: true },
          ],
        },
        {
          label: 'Enrichment & Search',
          description: 'Future AI-assisted enrichment writes here. Schema-ready; not implemented now.',
          fields: [
            {
              name: 'keywords',
              type: 'text',
              hasMany: true,
              admin: { description: 'Search keywords / popular-search terms (manual or AI-generated).' },
            },
            {
              name: 'popularity',
              type: 'number',
              defaultValue: 0,
              index: true,
              admin: { description: 'Popularity signal used by search ranking.' },
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
              name: 'enrichmentStatus',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'None', value: 'none' },
                { label: 'AI suggested', value: 'ai_suggested' },
                { label: 'Human reviewed', value: 'human_reviewed' },
              ],
              admin: { position: 'sidebar' },
            },
            { name: 'enrichedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
          ],
        },
      ],
    },
    {
      name: 'legacyKey',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'Stable import identity (product base SKU).' },
    },
    {
      name: 'lifecycle',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [...PRODUCT_LIFECYCLE],
      admin: { position: 'sidebar' },
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', index: true, admin: { position: 'sidebar' } },
    { name: 'brand', type: 'relationship', relationTo: 'brands', index: true, admin: { position: 'sidebar' } },
    { name: 'manufacturer', type: 'relationship', relationTo: 'manufacturers', index: true, admin: { position: 'sidebar' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Eligible for homepage Featured Products.' },
    },
    {
      name: 'needsReview',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Set by import when metadata (brand/unit/category) is missing.' },
    },
    {
      name: 'reviewNotes',
      type: 'text',
      admin: { position: 'sidebar', description: 'Why this product needs review.' },
    },
    {
      name: 'searchText',
      type: 'textarea',
      admin: { hidden: true, description: 'Maintained for full-text search (RO+RU+brand+category+specs).' },
    },
    seoField,
  ],
}

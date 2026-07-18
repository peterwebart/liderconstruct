import type { Block, GlobalConfig } from 'payload'

import { authenticated } from '../access'

const sectionHeader: Block['fields'] = [
  { name: 'title', type: 'text', localized: true },
  { name: 'subtitle', type: 'text', localized: true },
]

const FeaturedSections: Block = {
  slug: 'featuredSections',
  labels: { singular: 'Featured Sections', plural: 'Featured Sections' },
  fields: [
    ...sectionHeader,
    {
      name: 'sections',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Pick top-level Section nodes from the internal taxonomy.' },
    },
  ],
}
const PopularSearches: Block = {
  slug: 'popularSearches',
  labels: { singular: 'Popular Searches', plural: 'Popular Searches' },
  fields: [
    ...sectionHeader,
    {
      name: 'terms',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'query', type: 'text', required: true },
      ],
    },
  ],
}
const FeaturedBrands: Block = {
  slug: 'featuredBrands',
  labels: { singular: 'Featured Brands', plural: 'Featured Brands' },
  fields: [...sectionHeader, { name: 'brands', type: 'relationship', relationTo: 'brands', hasMany: true }],
}
const FeaturedCategories: Block = {
  slug: 'featuredCategories',
  labels: { singular: 'Featured Categories', plural: 'Featured Categories' },
  fields: [...sectionHeader, { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true }],
}
const FeaturedProducts: Block = {
  slug: 'featuredProducts',
  labels: { singular: 'Featured Products', plural: 'Featured Products' },
  fields: [...sectionHeader, { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true }],
}
const ProductQuery: Block = {
  slug: 'productQuery',
  labels: { singular: 'Product List (auto)', plural: 'Product Lists (auto)' },
  fields: [
    ...sectionHeader,
    {
      name: 'source',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Popular Products', value: 'popular' },
        { label: 'New Products', value: 'new' },
        { label: 'Recently Added', value: 'recent' },
        { label: 'Promotions', value: 'promotions' },
      ],
    },
    { name: 'limit', type: 'number', defaultValue: 8 },
  ],
}
const Editorial: Block = {
  slug: 'editorial',
  labels: { singular: 'Editorial Content', plural: 'Editorial Content' },
  fields: [
    ...sectionHeader,
    { name: 'content', type: 'richText', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}

/** Fully data-driven homepage. Sections are composed in Payload, not hardcoded. */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Content' },
  access: { read: () => true, update: authenticated },
  fields: [
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        FeaturedSections,
        FeaturedCategories,
        FeaturedBrands,
        FeaturedProducts,
        PopularSearches,
        ProductQuery,
        Editorial,
      ],
    },
  ],
}

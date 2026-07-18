import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { ATTRIBUTE_DATATYPES, ATTRIBUTE_GROUPS } from '../lib/constants'

/**
 * The Attribute Registry — single source of truth for every product/variation
 * attribute. Filters, search facets, comparison tables, specification blocks
 * and sort options are all derived from this collection. Nothing is hard-coded
 * in the application.
 */
export const Attributes: CollectionConfig = {
  slug: 'attributes',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'key', 'dataType', 'group', 'isFilterable', 'displayPriority'],
    group: 'Catalog',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable machine key (e.g. "thickness_mm"). Referenced by products.' },
    },
    { name: 'displayName', type: 'text', required: true, localized: true },
    {
      name: 'dataType',
      type: 'select',
      required: true,
      defaultValue: 'text',
      options: [...ATTRIBUTE_DATATYPES],
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [...ATTRIBUTE_GROUPS],
      admin: { description: 'Specification block grouping.' },
    },
    {
      name: 'unit',
      type: 'relationship',
      relationTo: 'units',
      admin: { description: 'Unit of measure for numeric/dimension attributes.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'isSearchable', type: 'checkbox', defaultValue: false },
        { name: 'isFilterable', type: 'checkbox', defaultValue: false },
        { name: 'isSortable', type: 'checkbox', defaultValue: false },
        { name: 'isComparable', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'displayPriority',
      type: 'number',
      defaultValue: 100,
      admin: { description: 'Lower shows first in filters / spec sheets.' },
    },
    {
      name: 'appliesToVariation',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'True if this attribute distinguishes variations (size, colour…).' },
    },
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Optional icon name (future UI).' },
    },
    {
      name: 'options',
      type: 'array',
      admin: {
        description: 'Allowed values for enum attributes (also seeds filter options).',
        condition: (data) => data?.dataType === 'enum',
      },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', localized: true },
      ],
    },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: { description: 'Supplier column headers that map to this attribute.' },
    },
  ],
}

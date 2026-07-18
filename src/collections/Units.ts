import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'

/**
 * Controlled vocabulary of units of measure. Replaces free-text units and
 * normalizes the messy source values (kg/Kg, sac/saci, 1 m2/m2…) via aliases.
 */
export const Units: CollectionConfig = {
  slug: 'units',
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'symbol'], group: 'Catalog' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    { name: 'label', type: 'text', localized: true, required: true },
    { name: 'symbol', type: 'text' },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: { description: 'Raw supplier unit strings mapping to this unit (e.g. "Kg", "saci").' },
    },
  ],
}

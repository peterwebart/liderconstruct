import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'

/**
 * Search synonyms / cross-language equivalents (e.g. gips carton ↔ гипсокартон).
 * Single source of truth consumed by the PostgreSQL search layer now and by
 * Meilisearch later — the application never reads this directly.
 */
export const Synonyms: CollectionConfig = {
  slug: 'synonyms',
  admin: { useAsTitle: 'term', defaultColumns: ['term', 'kind', 'locale'], group: 'Căutare' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'term', type: 'text', required: true, index: true },
    { name: 'synonyms', type: 'text', hasMany: true, required: true },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'synonym',
      options: [
        { label: 'Synonym', value: 'synonym' },
        { label: 'Translation (RO↔RU)', value: 'translation' },
      ],
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'both',
      options: [
        { label: 'RO', value: 'ro' },
        { label: 'RU', value: 'ru' },
        { label: 'Both', value: 'both' },
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Configurable search ranking. The search service reads these weights so
 * ranking is tuned in the CMS, not hardcoded. Engine-agnostic: the same
 * weights inform PostgreSQL scoring now and Meilisearch ranking rules later.
 */
export const SearchSettings: GlobalConfig = {
  slug: 'search-settings',
  admin: { group: 'Căutare' },
  access: { read: () => true, update: authenticated },
  fields: [
    {
      type: 'collapsible',
      label: 'Ranking signal weights',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'weightExactSku', type: 'number', defaultValue: 100 },
            { name: 'weightExactName', type: 'number', defaultValue: 80 },
            { name: 'weightBrand', type: 'number', defaultValue: 20 },
            { name: 'weightCategory', type: 'number', defaultValue: 15 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'weightPopularity', type: 'number', defaultValue: 25 },
            { name: 'weightFeatured', type: 'number', defaultValue: 30 },
            { name: 'weightAvailability', type: 'number', defaultValue: 10 },
            { name: 'weightKeywords', type: 'number', defaultValue: 15 },
          ],
        },
        { name: 'weightSynonyms', type: 'number', defaultValue: 10 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'typoTolerance', type: 'checkbox', defaultValue: true },
        {
          name: 'engine',
          type: 'select',
          defaultValue: 'postgres',
          options: [
            { label: 'PostgreSQL', value: 'postgres' },
            { label: 'Meilisearch', value: 'meilisearch' },
            { label: 'AI semantic', value: 'ai' },
          ],
          admin: { description: 'Informational; actual driver is set via SEARCH_DRIVER.' },
        },
      ],
    },
  ],
}

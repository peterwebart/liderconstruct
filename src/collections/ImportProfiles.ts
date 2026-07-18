import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { IMPORT_FORMATS } from '../lib/constants'

/**
 * Per-supplier/source mapping config. A new supplier = a new profile row, not
 * new code: column headers, format, delimiter and decimal separator are all
 * data. The LiderConstruct export is the first profile.
 */
export const ImportProfiles: CollectionConfig = {
  slug: 'import-profiles',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'sourceFormat'], group: 'Import' },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'sourceFormat', type: 'select', required: true, options: [...IMPORT_FORMATS] },
    { name: 'productsSheet', type: 'text', admin: { description: 'Sheet name for products (spreadsheets).' } },
    { name: 'variationsSheet', type: 'text', admin: { description: 'Sheet name for variations (if separate).' } },
    {
      type: 'row',
      fields: [
        { name: 'delimiter', type: 'text', defaultValue: ',', admin: { description: 'CSV/TSV delimiter.' } },
        {
          name: 'decimalSeparator',
          type: 'select',
          defaultValue: '.',
          options: [
            { label: 'Dot (.)', value: '.' },
            { label: 'Comma (,)', value: ',' },
          ],
        },
      ],
    },
    {
      name: 'columnMap',
      type: 'array',
      admin: { description: 'Maps a source header to a canonical field or attribute key.' },
      fields: [
        { name: 'sourceHeader', type: 'text', required: true },
        { name: 'targetField', type: 'text', required: true },
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'field',
          options: [
            { label: 'Core field', value: 'field' },
            { label: 'Product attribute (registry key)', value: 'attribute' },
            { label: 'Variation attribute', value: 'variation_attribute' },
          ],
        },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

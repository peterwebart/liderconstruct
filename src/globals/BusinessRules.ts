import type { GlobalConfig } from 'payload'

import { authenticated } from '../access'

/** CMS-configurable Business Rules. The import pipeline reads these to drive
 * product status and SEO generation (defaults in src/services/rules/config.ts). */
export const BusinessRules: GlobalConfig = {
  slug: 'business-rules',
  admin: { group: 'Import' },
  access: { read: authenticated, update: authenticated },
  fields: [
    {
      name: 'status',
      type: 'group',
      label: 'Product status rules',
      fields: [
        { name: 'priceOnRequestWhenNoPrice', type: 'checkbox', defaultValue: true, admin: { description: 'All variations without a price → "Price on Request".' } },
        { name: 'hiddenWhenNoActiveVariation', type: 'checkbox', defaultValue: true, admin: { description: 'No in-stock/low-stock variation → "Hidden".' } },
        { name: 'discontinuedFromSupplierFlag', type: 'checkbox', defaultValue: true, admin: { description: 'Supplier-flagged discontinued → "Discontinued".' } },
        {
          name: 'needsReviewWhenMissing',
          type: 'select',
          hasMany: true,
          defaultValue: ['brand', 'unit', 'category'],
          options: [
            { label: 'Brand', value: 'brand' },
            { label: 'Unit', value: 'unit' },
            { label: 'Category', value: 'category' },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO generation rules',
      fields: [
        { name: 'generateWhenEmpty', type: 'checkbox', defaultValue: true, admin: { description: 'Generate SEO only when fields are empty — manual edits always win.' } },
        { name: 'titleTemplate', type: 'text', defaultValue: '{name} {brand} — {section}' },
        {
          type: 'row',
          fields: [
            { name: 'maxTitle', type: 'number', defaultValue: 60 },
            { name: 'maxDescription', type: 'number', defaultValue: 155 },
          ],
        },
      ],
    },
  ],
}

import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { STOCK_STATUSES, VARIATION_ATTRIBUTE_TYPES } from '../lib/constants'

interface VariationAttribute {
  value?: string | null
}
interface VariationData {
  price?: number | null
  priceOnRequest?: boolean | null
  label?: string | null
  attributes?: VariationAttribute[] | null
}

/** Never show "0,00 lei": a missing/zero price becomes price-on-request. Also
 * derives a human label from the variation attributes. */
const normalizeVariation: CollectionBeforeChangeHook = ({ data }) => {
  const v = data as VariationData
  if (v.price == null || Number(v.price) <= 0) {
    v.priceOnRequest = true
    v.price = null
  }
  if (Array.isArray(v.attributes) && v.attributes.length > 0) {
    const derived = v.attributes
      .map((a) => (typeof a.value === 'string' ? a.value.trim() : ''))
      .filter(Boolean)
      .join(' / ')
    if (derived) v.label = derived
  }
  return v
}

/**
 * A priced variation of a Product, identified by SKU (LC-#####/n).
 * SKU is the global synchronization key for supplier price/stock updates.
 */
export const Variations: CollectionConfig = {
  slug: 'variations',
  admin: {
    useAsTitle: 'sku',
    defaultColumns: ['sku', 'product', 'price', 'priceOnRequest', 'stockStatus'],
    group: 'Catalog',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { beforeChange: [normalizeVariation] },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Supplier/internal SKU. The synchronization key for imports.' },
    },
    { name: 'barcode', type: 'text', index: true, admin: { description: 'EAN/barcode (future).' } },
    { name: 'price', type: 'number', min: 0, admin: { description: 'Price in MDL. Blank => "Preț la cerere".' } },
    {
      name: 'priceOnRequest',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Auto-enabled when there is no price.' },
    },
    { name: 'stockStatus', type: 'select', defaultValue: 'in_stock', options: [...STOCK_STATUSES] },
    {
      name: 'label',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Auto-derived from attributes (e.g. "12,5 mm / Alb").' },
    },
    {
      name: 'attributes',
      type: 'array',
      labels: { singular: 'Attribute', plural: 'Attributes' },
      fields: [
        { name: 'type', type: 'select', required: true, options: [...VARIATION_ATTRIBUTE_TYPES] },
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'value', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
  ],
}

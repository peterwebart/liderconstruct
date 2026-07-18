import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { notifyOrder, prepareOrder } from '../hooks/orders'
import { ORDER_STATUSES } from '../lib/constants'

/**
 * The "order request" (inquiry cart): no payment, no account. A customer
 * submits name + phone (+ optional contact/delivery); the business is emailed
 * and works the order from this list, calling to confirm price and delivery.
 *
 * Public creation goes through a server action (overrideAccess) that first
 * checks the honeypot — so direct REST create is restricted to staff.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customer.name', 'customer.phone', 'estimatedTotal', 'createdAt'],
    group: 'Comenzi',
    listSearchableFields: ['orderNumber', 'customer.name', 'customer.phone'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [prepareOrder],
    afterChange: [notifyOrder],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'number',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'noua',
      options: [...ORDER_STATUSES],
      admin: { position: 'sidebar', description: 'Order lifecycle — worked from this list.' },
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'ro',
      options: [
        { label: 'Română', value: 'ro' },
        { label: 'Русский', value: 'ru' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'group',
      label: 'Client',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'phone', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'email', type: 'email' },
            { name: 'locality', type: 'text', required: true, label: 'Localitate' },
          ],
        },
        { name: 'address', type: 'textarea', label: 'Adresă livrare' },
        { name: 'notes', type: 'textarea', label: 'Note' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Produse',
      minRows: 1,
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'sku', type: 'text' },
            { name: 'quantity', type: 'number', required: true, min: 1, defaultValue: 1 },
          ],
        },
        { name: 'productTitle', type: 'text' },
        { name: 'variationLabel', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'unitPrice', type: 'number', admin: { description: 'MDL. Blank = preț la cerere.' } },
            { name: 'priceOnRequest', type: 'checkbox', defaultValue: false },
            { name: 'lineTotal', type: 'number', admin: { readOnly: true } },
          ],
        },
      ],
    },
    {
      name: 'estimatedTotal',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Estimat — prețul final se confirmă la telefon (incl. livrare).',
      },
    },
  ],
}

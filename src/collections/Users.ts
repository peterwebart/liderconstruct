import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/** Admin/operator accounts. The Orders list is worked from here. */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    group: 'Administrare',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}

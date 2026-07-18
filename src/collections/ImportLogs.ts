import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { IMPORT_LOG_ACTIONS } from '../lib/constants'

/** Per-row outcome for an import run; exportable as the validation/error report. */
export const ImportLogs: CollectionConfig = {
  slug: 'import-logs',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['run', 'rowNumber', 'sku', 'action', 'message'],
    group: 'Import',
  },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'run', type: 'relationship', relationTo: 'import-runs', index: true },
    { name: 'rowNumber', type: 'number' },
    { name: 'sku', type: 'text', index: true },
    { name: 'action', type: 'select', options: [...IMPORT_LOG_ACTIONS] },
    {
      name: 'level',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
      ],
    },
    { name: 'field', type: 'text' },
    { name: 'message', type: 'text' },
    { name: 'suggestedFix', type: 'text' },
    { name: 'sourceFile', type: 'text' },
  ],
}

import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { IMPORT_MODES, IMPORT_RUN_STATUSES } from '../lib/constants'

/** Complete, auditable record of every import run (incl. rollback snapshot). */
export const ImportRuns: CollectionConfig = {
  slug: 'import-runs',
  admin: {
    useAsTitle: 'sourceFile',
    defaultColumns: ['sourceFile', 'mode', 'status', 'createdAt'],
    group: 'Import',
  },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'sourceFile', type: 'text', required: true },
    { name: 'checksum', type: 'text', index: true, admin: { description: 'SHA-256 of the source file.' } },
    { name: 'mode', type: 'select', required: true, options: [...IMPORT_MODES] },
    { name: 'profile', type: 'relationship', relationTo: 'import-profiles' },
    { name: 'status', type: 'select', required: true, defaultValue: 'pending', options: [...IMPORT_RUN_STATUSES] },
    {
      type: 'row',
      fields: [
        { name: 'importedRows', type: 'number', defaultValue: 0 },
        { name: 'createdRows', type: 'number', defaultValue: 0 },
        { name: 'updatedRows', type: 'number', defaultValue: 0 },
        { name: 'skippedRows', type: 'number', defaultValue: 0 },
        { name: 'deletedRows', type: 'number', defaultValue: 0 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'warnings', type: 'number', defaultValue: 0 },
        { name: 'errors', type: 'number', defaultValue: 0 },
        { name: 'executionTimeMs', type: 'number', defaultValue: 0 },
      ],
    },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'rollbackSnapshot',
      type: 'json',
      admin: { description: 'Pre-write snapshot of affected records for rollback.' },
    },
    { name: 'report', type: 'json', admin: { description: 'Structured dry-run / execution report.' } },
    { name: 'startedAt', type: 'date' },
    { name: 'finishedAt', type: 'date' },
  ],
}

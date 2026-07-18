import type { Field, FieldHook } from 'payload'

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (ă, î, ș, ț…)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) return toSlug(value)
    const fallback = data?.[fallbackField]
    if (typeof fallback === 'string') return toSlug(fallback)
    return value
  }

/**
 * Human-readable, SEO-friendly slug. Localized so RO and RU URLs can differ.
 * Auto-derived from `sourceField` when left blank.
 */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  localized: true,
  required: true,
  admin: {
    position: 'sidebar',
    description: 'Auto-generated from the name if left blank. Used in the URL.',
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField)],
  },
})

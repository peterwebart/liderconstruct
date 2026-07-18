/**
 * Specification sheet builder (ADR-0004): the spec table renders ONLY
 * attributes known to the registry — registry existence is what makes an
 * attribute displayable, its `group` decides the block, `displayPriority`
 * the order, and `dataType` whether the value renders in mono.
 */

export interface SpecAttributeInput {
  key: string
  value: string
}

export interface SpecRegistryEntry {
  key: string
  displayName: string
  group: 'technical' | 'dimensions' | 'packaging' | 'performance' | 'installation' | 'general'
  dataType: string
  displayPriority: number
}

export interface SpecRow {
  label: string
  value: string
  mono: boolean
}

export interface SpecGroup {
  key: SpecRegistryEntry['group']
  label: string
  rows: SpecRow[]
}

const GROUP_LABELS: Record<SpecRegistryEntry['group'], string> = {
  dimensions: 'Dimensiuni',
  technical: 'Tehnic',
  performance: 'Performanță',
  installation: 'Montaj',
  packaging: 'Ambalare',
  general: 'General',
}

const GROUP_ORDER: SpecRegistryEntry['group'][] = [
  'dimensions',
  'technical',
  'performance',
  'installation',
  'packaging',
  'general',
]

const MONO_TYPES = new Set(['dimension', 'number', 'range'])

export function buildSpecGroups(
  attributes: SpecAttributeInput[],
  registry: SpecRegistryEntry[],
): SpecGroup[] {
  const byKey = new Map(registry.map((r) => [r.key, r]))
  const buckets = new Map<SpecRegistryEntry['group'], { row: SpecRow; priority: number }[]>()

  for (const attr of attributes) {
    const entry = byKey.get(attr.key)
    if (!entry || !attr.value) continue
    const row: SpecRow = {
      label: entry.displayName,
      value: attr.value,
      mono: MONO_TYPES.has(entry.dataType) || /^\d/.test(attr.value.trim()),
    }
    const bucket = buckets.get(entry.group) ?? []
    bucket.push({ row, priority: entry.displayPriority })
    buckets.set(entry.group, bucket)
  }

  return GROUP_ORDER.filter((g) => (buckets.get(g)?.length ?? 0) > 0).map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    rows: (buckets.get(g) ?? []).sort((a, b) => a.priority - b.priority).map((b) => b.row),
  }))
}

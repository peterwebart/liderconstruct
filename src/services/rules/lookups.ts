import { aliasKey } from './text'

export interface AliasResolution {
  matched: boolean
  canonical: string | null
}
/** Resolves a raw value to a canonical id/code via an alias map. Used for
 * brands, units and categories so capitalization/format never duplicates. */
export function resolveAlias(value: string | null, lookup: Map<string, string>): AliasResolution {
  if (!value) return { matched: false, canonical: null }
  const hit = lookup.get(aliasKey(value))
  return hit ? { matched: true, canonical: hit } : { matched: false, canonical: null }
}
export const normalizeUnit = resolveAlias
export const normalizeBrand = resolveAlias

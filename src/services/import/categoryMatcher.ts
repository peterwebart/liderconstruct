import { TAXONOMY, type TaxNode } from '../../seed/taxonomy'
import { aliasKey, slugify } from './normalizer'

export interface FlatNode {
  path: string
  slug: string
  level: number
  tokens: Set<string>
  keys: string[]
}
export interface CategoryProposal {
  supplier: string
  count: number
  suggestedPath: string | null
  suggestedSlug: string | null
  confidence: number
  reasons: string[]
  alternativePath: string | null
  alternativeConfidence: number
}

const tokens = (s: string): string[] => aliasKey(s).split(' ').filter((t) => t.length >= 3)

/** Flattens the taxonomy to leaf-ish nodes (Category + Subcategory) with their
 * title + keyword hints for matching. */
export function flattenTaxonomy(nodes: TaxNode[] = TAXONOMY, prefix: string[] = [], level = 0): FlatNode[] {
  const out: FlatNode[] = []
  for (const n of nodes) {
    const path = [...prefix, n.title]
    const keys = [n.title, ...(n.keywords ?? [])].map(aliasKey)
    const tokSet = new Set<string>(keys.flatMap((k) => k.split(' ')).filter((t) => t.length >= 3))
    if (level >= 1) out.push({ path: path.join(' > '), slug: slugify(n.title), level, tokens: tokSet, keys })
    if (n.children) out.push(...flattenTaxonomy(n.children, path, level + 1))
  }
  return out
}

function score(supplier: string, node: FlatNode): { score: number; reason: string } {
  const sKey = aliasKey(supplier)
  const sTokens = new Set(tokens(supplier))
  let best = 0
  let reason = ''
  for (const k of node.keys) {
    if (!k) continue
    if (k === sKey) return { score: 0.98, reason: `exact match "${k}"` }
    if (k.length >= 4 && (sKey.includes(k) || k.includes(sKey))) {
      if (0.86 > best) {
        best = 0.86
        reason = `keyword "${k}"`
      }
    }
  }
  if (sTokens.size) {
    let overlap = 0
    for (const t of sTokens) if (node.tokens.has(t)) overlap++
    const contain = overlap / sTokens.size
    if (contain > 0 && contain * 0.8 > best) {
      best = Math.round(contain * 0.8 * 100) / 100
      reason = `${overlap}/${sTokens.size} tokens`
    }
  }
  return { score: best, reason }
}

export function proposeCategoryMappings(
  supplierCategories: { value: string; count: number }[],
): CategoryProposal[] {
  const flat = flattenTaxonomy()
  return supplierCategories
    .map(({ value, count }) => {
      const ranked = flat
        .map((n) => ({ n, ...score(value, n) }))
        .sort((a, b) => b.score - a.score)
      const top = ranked[0]
      const alt = ranked[1]
      return {
        supplier: value,
        count,
        suggestedPath: top && top.score > 0 ? top.n.path : null,
        suggestedSlug: top && top.score > 0 ? top.n.slug : null,
        confidence: top ? top.score : 0,
        reasons: top && top.score > 0 ? [top.reason] : ['no match — assign manually'],
        alternativePath: alt && alt.score > 0 ? alt.n.path : null,
        alternativeConfidence: alt ? alt.score : 0,
      }
    })
    .sort((a, b) => b.count - a.count)
}

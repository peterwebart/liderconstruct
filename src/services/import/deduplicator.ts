import type { CanonicalProduct, DuplicateCandidate } from './types'
import { aliasKey } from './normalizer'

/**
 * Detects suspected duplicate products by name with a confidence score and
 * reasons. Never merges — output is a review report only.
 */
export function findDuplicateCandidates(products: CanonicalProduct[]): DuplicateCandidate[] {
  const byName = new Map<string, CanonicalProduct[]>()
  for (const p of products) {
    const k = aliasKey(p.title)
    ;(byName.get(k) ?? byName.set(k, []).get(k)!).push(p)
  }

  const candidates: DuplicateCandidate[] = []
  for (const group of byName.values()) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        const reasons: string[] = ['identical name']
        let score = 0.5
        if (a.categorySource && a.categorySource === b.categorySource) {
          score += 0.25
          reasons.push('same category')
        }
        if (a.brandSource && b.brandSource && a.brandSource === b.brandSource) {
          score += 0.15
          reasons.push('same brand')
        }
        if (a.unitSource && a.unitSource === b.unitSource) {
          score += 0.05
          reasons.push('same unit')
        }
        candidates.push({
          legacyKeyA: a.legacyKey,
          legacyKeyB: b.legacyKey,
          name: a.title,
          confidence: Math.min(0.95, Math.round(score * 100) / 100),
          reasons,
        })
      }
    }
  }
  return candidates.sort((x, y) => y.confidence - x.confidence)
}

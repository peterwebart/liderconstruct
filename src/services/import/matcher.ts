import type { Payload } from 'payload'

import type { CanonicalProduct } from './types'

export interface MatchResult {
  toCreate: CanonicalProduct[]
  toUpdate: { product: CanonicalProduct; existingId: number }[]
}

/** Decide create vs update by legacyKey (never by name). */
export async function matchProducts(
  payload: Payload,
  products: CanonicalProduct[],
): Promise<MatchResult> {
  const keys = products.map((p) => p.legacyKey)
  const existing = await payload.find({
    collection: 'products',
    where: { legacyKey: { in: keys } },
    limit: keys.length || 1,
    pagination: false,
    depth: 0,
  })
  const byKey = new Map<string, number>()
  for (const d of existing.docs) {
    if (d.legacyKey) byKey.set(d.legacyKey, d.id)
  }
  const toCreate: CanonicalProduct[] = []
  const toUpdate: MatchResult['toUpdate'] = []
  for (const p of products) {
    const id = byKey.get(p.legacyKey)
    if (id == null) toCreate.push(p)
    else toUpdate.push({ product: p, existingId: id })
  }
  return { toCreate, toUpdate }
}

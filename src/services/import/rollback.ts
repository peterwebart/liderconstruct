import type { Payload } from 'payload'

import type { Product } from '../../payload-types'

export interface Snapshot {
  products: Product[]
}

/** Snapshot affected records before a write so a run can be rolled back. */
export async function snapshot(payload: Payload, legacyKeys: string[]): Promise<Snapshot> {
  if (legacyKeys.length === 0) return { products: [] }
  const products = await payload.find({
    collection: 'products',
    where: { legacyKey: { in: legacyKeys } },
    pagination: false,
    depth: 0,
  })
  return { products: products.docs }
}

/** Restore a previous snapshot (used by the rollback manager). */
export async function restore(payload: Payload, snap: Snapshot): Promise<void> {
  for (const doc of snap.products) {
    const { id, createdAt: _c, updatedAt: _u, ...data } = doc
    await payload.update({ collection: 'products', id, data, depth: 0 })
  }
}

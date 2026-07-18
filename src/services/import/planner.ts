import type { MatchResult } from './matcher'

export type ImportMode = 'full' | 'incremental' | 'price_only' | 'stock_only' | 'product_only' | 'dry_run'

export interface ChangePlan {
  mode: ImportMode
  productsToCreate: number
  productsToUpdate: number
  variationsAffected: number
  /** Fields the executor is allowed to write for this mode. */
  variationFieldScope: 'all' | 'price' | 'stock' | 'none'
  productFieldScope: 'all' | 'none'
}

/** Builds a descriptive plan; field scope enforces that e.g. a price-only run
 * never touches enriched product data. */
export function buildPlan(match: MatchResult, mode: ImportMode): ChangePlan {
  const variationsAffected =
    match.toCreate.reduce((n, p) => n + p.variations.length, 0) +
    match.toUpdate.reduce((n, m) => n + m.product.variations.length, 0)

  const variationFieldScope =
    mode === 'price_only' ? 'price' : mode === 'stock_only' ? 'stock' : mode === 'product_only' ? 'none' : 'all'
  const productFieldScope = mode === 'price_only' || mode === 'stock_only' ? 'none' : 'all'

  return {
    mode,
    productsToCreate: mode === 'price_only' || mode === 'stock_only' ? 0 : match.toCreate.length,
    productsToUpdate: match.toUpdate.length,
    variationsAffected,
    variationFieldScope,
    productFieldScope,
  }
}

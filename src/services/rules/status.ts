import type { StatusRulesConfig } from './config'

export interface StatusVariation {
  priceOnRequest: boolean
  stockStatus: string
}
export interface ProductStatusInput {
  variations: StatusVariation[]
  missing: { brand: boolean; unit: boolean; category: boolean }
  supplierDiscontinued?: boolean
}
export interface ProductStatusResult {
  lifecycle: string
  needsReview: boolean
  reasons: string[]
}

/**
 * Configurable product status rules. Precedence:
 * discontinued → hidden (no active variation) → price_on_request (all on
 * request) → active. needsReview is orthogonal (missing required metadata).
 */
export function computeProductStatus(
  input: ProductStatusInput,
  config: StatusRulesConfig,
): ProductStatusResult {
  const reasons: string[] = []
  const hasVariations = input.variations.length > 0
  const hasActive = input.variations.some(
    (v) => v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock',
  )
  const allOnRequest = hasVariations && input.variations.every((v) => v.priceOnRequest)

  let lifecycle = 'active'
  if (config.discontinuedFromSupplierFlag && input.supplierDiscontinued) {
    lifecycle = 'discontinued'
    reasons.push('supplier discontinued')
  } else if (config.hiddenWhenNoActiveVariation && (!hasVariations || !hasActive)) {
    lifecycle = 'hidden'
    reasons.push(hasVariations ? 'no active variation' : 'no variations')
  } else if (config.priceOnRequestWhenNoPrice && allOnRequest) {
    lifecycle = 'price_on_request'
    reasons.push('all variations price-on-request')
  }

  const needsReasons = config.needsReviewWhenMissing.filter((k) => input.missing[k])
  if (needsReasons.length) reasons.push(`missing ${needsReasons.join(', ')}`)

  return { lifecycle, needsReview: needsReasons.length > 0, reasons }
}

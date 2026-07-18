/** Configurable Business Rules. Defaults live here; a Payload global
 * (BusinessRules) can override the status thresholds at runtime. */
export interface StatusRulesConfig {
  /** All variations priced ≤0/blank → product lifecycle "price_on_request". */
  priceOnRequestWhenNoPrice: boolean
  /** No active (in/low stock) variation → "hidden". */
  hiddenWhenNoActiveVariation: boolean
  /** Supplier-flagged discontinued → "discontinued". */
  discontinuedFromSupplierFlag: boolean
  /** Missing any of these marks the product needsReview. */
  needsReviewWhenMissing: Array<'brand' | 'unit' | 'category'>
}
export interface SeoRulesConfig {
  generateWhenEmpty: boolean
  titleTemplate: string // tokens: {name} {brand} {section}
  maxTitle: number
  maxDescription: number
}
export interface RulesConfig {
  defaultLocale: 'ro' | 'ru'
  baseUrl: string
  status: StatusRulesConfig
  seo: SeoRulesConfig
}

export const defaultRulesConfig: RulesConfig = {
  defaultLocale: 'ro',
  baseUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'https://liderconstruct.md',
  status: {
    priceOnRequestWhenNoPrice: true,
    hiddenWhenNoActiveVariation: true,
    discontinuedFromSupplierFlag: true,
    needsReviewWhenMissing: ['brand', 'unit', 'category'],
  },
  seo: {
    generateWhenEmpty: true,
    titleTemplate: '{name} {brand} — {section}',
    maxTitle: 60,
    maxDescription: 155,
  },
}

/** Canonical, engine-independent import types (no Payload dependency). */
export type RawRow = Record<string, unknown>

export interface CanonicalVariationAttribute {
  type: string
  value: string
}
export interface CanonicalVariation {
  sku: string
  price: number | null
  priceOnRequest: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  attributes: CanonicalVariationAttribute[]
  rowNumber: number
}

export interface CanonicalProductAttribute {
  key: string
  label: string
  value: string
  numericValue?: number | null
}
export interface CanonicalProduct {
  legacyKey: string
  title: string
  categorySource: string | null
  brandSource: string | null
  unitSource: string | null
  countryOfOrigin: string | null
  applicationRo: string | null
  applicationRu: string | null
  attributes: CanonicalProductAttribute[]
  variationSkus: string[]
  variations: CanonicalVariation[]
  needsReview: boolean
  reviewNotes: string[]
  rowNumber: number
}

export type IssueLevel = 'error' | 'warning'
export interface ValidationIssue {
  level: IssueLevel
  code: string
  message: string
  action: 'skip' | 'quarantine' | 'warning'
  sku?: string
  rowNumber?: number
  field?: string
  suggestedFix?: string
  sourceFile?: string
}

export interface DuplicateCandidate {
  legacyKeyA: string
  legacyKeyB: string
  name: string
  confidence: number
  reasons: string[]
}

export interface UnmappedValue {
  value: string
  count: number
  suggestion?: string
}
export interface MappingReport {
  unmappedCategories: UnmappedValue[]
  unmappedBrands: UnmappedValue[]
  unmappedUnits: UnmappedValue[]
}

export interface ImportReport {
  sourceFile: string
  checksum: string
  format: string
  statistics: {
    productRows: number
    variationRows: number
    uniqueProducts: number
    importableProducts: number
    importableVariations: number
    multiVariationProducts: number
    maxVariationsPerProduct: number
    avgVariationsPerProduct: number
    missingBrand: number
    missingUnit: number
    missingCategory: number
    priceOnRequest: number
    distinctCategories: number
    distinctBrands: number
    distinctUnits: number
  }
  issues: ValidationIssue[]
  issueSummary: Record<string, number>
  statusBreakdown: Record<string, number>
  needsReviewCount: number
  categoryMapping: {
    mappedCategories: number
    pendingCategories: number
    mappedProducts: number
    pendingProducts: number
  }
  duplicates: DuplicateCandidate[]
  mapping: MappingReport
  performance: { durationMs: number; rowsPerSecond: number }
}

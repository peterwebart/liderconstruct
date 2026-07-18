/** Engine-agnostic search contracts. The app depends only on these types. */
export type Locale = 'ro' | 'ru'

export interface SearchFacetFilter {
  key: string
  values: string[]
}

export interface SearchQuery {
  term?: string
  locale: Locale
  filters?: SearchFacetFilter[]
  sectionSlug?: string
  categorySlug?: string
  brandSlug?: string
  priceMin?: number
  priceMax?: number
  inStockOnly?: boolean
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  page?: number
  pageSize?: number
}

export interface SearchHit {
  id: string
  slug: string
  title: string
  brand?: string | null
  /** Product base SKU (legacyKey). */
  sku?: string | null
  priceMin: number | null
  priceOnRequest: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  inStock: boolean
  unit?: string | null
  primaryImageUrl?: string | null
  variationCount: number
  defaultVariationSku?: string | null
  defaultVariationLabel?: string | null
}

export interface FacetValue {
  value: string
  label?: string
  count: number
}
export interface Facet {
  key: string
  label: string
  values: FacetValue[]
}

/** Full facet payload for a catalog context (category/search/brand page). */
export interface FacetsResult {
  facets: Facet[]
  priceRange: { min: number | null; max: number | null }
  stockCounts: { inStock: number; total: number }
}

export interface SearchResult {
  hits: SearchHit[]
  total: number
  page: number
  pageSize: number
  facets: Facet[]
}

/** One denormalized document per product. Same shape feeds PG FTS now and a
 * Meilisearch index later (no model change). */
export interface SearchDocument {
  id: string
  slug: string
  title: { ro?: string; ru?: string }
  brand?: string
  brandSlug?: string
  manufacturer?: string
  sectionSlug?: string
  categoryPath: string[]
  skus: string[]
  priceMin: number | null
  priceMax: number | null
  priceOnRequest: boolean
  inStock: boolean
  lifecycle: string
  /** Registry-driven facet values keyed by attribute key. */
  facets: Record<string, string[]>
  /** Flattened searchable text (RO+RU+brand+category+specs+synonyms). */
  searchText: string
}

/** Instant-search (suggest) result groups — engine-agnostic. */
export interface SuggestProduct {
  id: string
  slug: string
  title: string
  brand?: string | null
  sku?: string | null
  priceMin: number | null
  priceOnRequest: boolean
  inStock: boolean
}
export interface SuggestBrand {
  id: string
  slug: string
  name: string
  count: number
}
export interface SuggestCategory {
  id: string
  slug: string
  href: string
  title: string
  path: string
  count: number
}
export interface SuggestGroups {
  term: string
  products: SuggestProduct[]
  brands: SuggestBrand[]
  categories: SuggestCategory[]
}

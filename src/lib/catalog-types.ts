/** Client-safe DTOs consumed by catalog cards/grids. Produced by the server
 * catalog queries (pages increment) from Products + aggregated Variations. */

/** A variation as shown in a listing card's selector (bounded subset). */
export interface ProductCardVariation {
  sku: string
  /** Human label ("25 kg", "700×2000"); falls back to the SKU when absent. */
  label: string | null
  price: number | null
  priceOnRequest: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface ProductCardData {
  id: string
  slug: string
  title: string
  brand?: string | null
  /** Product base SKU (legacyKey) — mono in the UI. */
  sku?: string | null
  priceMin: number | null
  priceOnRequest: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  /** Unit symbol for per-unit price display (m², buc…). */
  unit?: string | null
  imageUrl?: string | null
  /** TOTAL number of variations (may exceed `variations.length`). */
  variationCount: number
  /**
   * Bounded list of variations for the card selector — capped server-side so a
   * 10k-product catalog never ships every variation to the browser. When
   * `variationCount > variations.length`, the card links to the product page
   * for the rest.
   */
  variations: ProductCardVariation[]
  /** Set when a single variation exists — enables quick add from the card. */
  defaultVariationSku?: string | null
  defaultVariationLabel?: string | null
}

/** One sellable variation, ready for the BuyPanel picker. */
export interface ProductVariationData {
  sku: string
  price: number | null
  priceOnRequest: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  /** Derived human label (e.g. "700×2000" / "20 kg"). */
  label: string | null
  attributes: { type: string; label?: string | null; value: string }[]
}

/** Gallery image (Media-backed later; placeholders until enrichment). */
export interface GalleryImage {
  url: string
  alt?: string | null
}

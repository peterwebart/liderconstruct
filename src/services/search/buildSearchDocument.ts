import type { SearchDocument } from './types'

interface MinimalVariation {
  sku?: string | null
  price?: number | null
  priceOnRequest?: boolean | null
  stockStatus?: string | null
}
interface MinimalProductAttr {
  key?: string | null
  value?: string | null
}
interface MinimalProduct {
  id: string | number
  slug?: string | null
  title?: string | null
  titleRu?: string | null
  brandName?: string | null
  brandSlug?: string | null
  manufacturerName?: string | null
  sectionSlug?: string | null
  categoryPath?: string[]
  lifecycle?: string | null
  attributes?: MinimalProductAttr[]
}

/**
 * Builds the engine-agnostic denormalized document for a product + its
 * variations. Pure function (no DB / engine dependency) so it is reusable by
 * the importer, write hooks, and any indexer.
 */
export function buildSearchDocument(
  product: MinimalProduct,
  variations: MinimalVariation[],
  extraSynonyms: string[] = [],
): SearchDocument {
  const prices = variations
    .filter((v) => !v.priceOnRequest && typeof v.price === 'number')
    .map((v) => v.price as number)
  const priceMin = prices.length ? Math.min(...prices) : null
  const priceMax = prices.length ? Math.max(...prices) : null
  const priceOnRequest = prices.length === 0
  const inStock = variations.some((v) => v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock')

  const facets: Record<string, string[]> = {}
  for (const a of product.attributes ?? []) {
    if (!a.key || !a.value) continue
    ;(facets[a.key] ??= []).push(a.value)
  }

  const searchText = [
    product.title,
    product.titleRu,
    product.brandName,
    product.manufacturerName,
    ...(product.categoryPath ?? []),
    ...variations.map((v) => v.sku).filter(Boolean),
    ...Object.values(facets).flat(),
    ...extraSynonyms,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id: String(product.id),
    slug: product.slug ?? '',
    title: { ro: product.title ?? undefined, ru: product.titleRu ?? undefined },
    brand: product.brandName ?? undefined,
    brandSlug: product.brandSlug ?? undefined,
    manufacturer: product.manufacturerName ?? undefined,
    sectionSlug: product.sectionSlug ?? undefined,
    categoryPath: product.categoryPath ?? [],
    skus: variations.map((v) => v.sku ?? '').filter(Boolean),
    priceMin,
    priceMax,
    priceOnRequest,
    inStock,
    lifecycle: product.lifecycle ?? 'active',
    facets,
    searchText,
  }
}

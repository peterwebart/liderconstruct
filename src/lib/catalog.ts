import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Category } from '@/payload-types'
import { getSearchService } from '@/services/search'
import type { FacetsResult, SearchQuery } from '@/services/search/types'

import type { ProductCardData } from './catalog-types'
import type { FilterState } from './filter-params'

/**
 * Server-side catalog access for pages. Thin: builds engine-agnostic
 * SearchQueries from URL filter state and caches results 60s under the
 * 'catalog' tag (revalidated after imports).
 */

export const CATALOG_PAGE_SIZE = 24

export interface CatalogContext {
  term?: string
  categorySlug?: string
  brandSlug?: string
  locale?: 'ro' | 'ru'
}

function toSearchQuery(ctx: CatalogContext, f: FilterState, page: number): SearchQuery {
  return {
    term: ctx.term,
    categorySlug: ctx.categorySlug,
    brandSlug: ctx.brandSlug,
    locale: ctx.locale ?? 'ro',
    filters: [
      ...(f.brands.length ? [{ key: '_brand', values: f.brands }] : []),
      ...Object.entries(f.attrs).map(([key, values]) => ({ key, values })),
    ],
    priceMin: f.priceMin ?? undefined,
    priceMax: f.priceMax ?? undefined,
    inStockOnly: f.inStockOnly || undefined,
    sort: f.sort,
    page,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

const cachedSearch = unstable_cache(
  async (query: SearchQuery) => {
    const payload = await getPayload({ config })
    return getSearchService(payload).search(query)
  },
  ['catalog-search'],
  { revalidate: 60, tags: ['catalog'] },
)

const cachedFacets = unstable_cache(
  async (query: SearchQuery) => {
    const payload = await getPayload({ config })
    return getSearchService(payload).facets(query)
  },
  ['catalog-facets'],
  { revalidate: 60, tags: ['catalog'] },
)

export interface CatalogPage {
  products: ProductCardData[]
  total: number
  page: number
  pageCount: number
}

export async function getCatalogPage(
  ctx: CatalogContext,
  filters: FilterState,
  page: number,
): Promise<CatalogPage> {
  const result = await cachedSearch(toSearchQuery(ctx, filters, page))
  return {
    products: result.hits.map(
      (h): ProductCardData => ({
        id: h.id,
        slug: h.slug,
        title: h.title,
        brand: h.brand ?? null,
        sku: h.sku ?? null,
        priceMin: h.priceMin,
        priceOnRequest: h.priceOnRequest,
        stockStatus: h.stockStatus,
        unit: h.unit ?? null,
        imageUrl: h.primaryImageUrl ?? null,
        variationCount: h.variationCount,
        defaultVariationSku: h.defaultVariationSku ?? null,
        defaultVariationLabel: h.defaultVariationLabel ?? null,
      }),
    ),
    total: result.total,
    page: result.page,
    pageCount: Math.max(1, Math.ceil(result.total / result.pageSize)),
  }
}

/** Context-scoped facets (counts before attribute selections — see service). */
export async function getCatalogFacets(ctx: CatalogContext): Promise<FacetsResult> {
  return cachedFacets({
    term: ctx.term,
    categorySlug: ctx.categorySlug,
    brandSlug: ctx.brandSlug,
    locale: ctx.locale ?? 'ro',
  })
}

export interface CategoryPageContext {
  id: number
  title: string
  slug: string
  level: Category['level']
  /** Root-first trail, current node last. */
  trail: { title: string; slug: string; href: string }[]
  children: { id: number; title: string; href: string; icon: string | null }[]
}

const loadCategoryContext = async (
  slug: string,
  locale: 'ro' | 'ru',
): Promise<CategoryPageContext | null> => {
  try {
    const payload = await getPayload({ config })
    const all = await payload.find({
      collection: 'categories',
      limit: 500,
      pagination: false,
      depth: 0,
      locale,
    })
    const node = all.docs.find((c) => c.slug === slug)
    if (!node) return null

    const byId = new Map(all.docs.map((c) => [c.id, c]))
    const chain: Category[] = [node]
    let cur: Category = node
    for (let i = 0; i < 4; i++) {
      const pid = typeof cur.parent === 'number' ? cur.parent : cur.parent?.id
      if (pid == null) break
      const parent = byId.get(pid)
      if (!parent) break
      chain.unshift(parent)
      cur = parent
    }
    const section = chain[0]
    const hrefFor = (c: Category): string =>
      c.level === 'section' ? `/category/${c.slug}` : `/category/${section.slug}/${c.slug}`

    const children = all.docs
      .filter((c) => {
        const pid = typeof c.parent === 'number' ? c.parent : c.parent?.id
        return pid === node.id
      })
      .sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.title.localeCompare(b.title, 'ro'),
      )
      .map((c) => ({ id: c.id, title: c.title, href: hrefFor(c), icon: c.icon ?? null }))

    return {
      id: node.id,
      title: node.title,
      slug: node.slug,
      level: node.level,
      trail: chain.map((c) => ({ title: c.title, slug: c.slug, href: hrefFor(c) })),
      children,
    }
  } catch {
    return null
  }
}

export const getCategoryContext = (
  slug: string,
  locale: 'ro' | 'ru' = 'ro',
): Promise<CategoryPageContext | null> =>
  unstable_cache(loadCategoryContext, ['category-context'], {
    revalidate: 300,
    tags: ['navigation'],
  })(slug, locale)

/* ------------------------------------------------------------------ */
/* Product cards by explicit ids (homepage blocks, related rails).     */
/* ------------------------------------------------------------------ */

const loadProductCards = async (ids: number[], locale: 'ro' | 'ru'): Promise<ProductCardData[]> => {
  if (ids.length === 0) return []
  try {
    const payload = await getPayload({ config })
    const [prods, units, brands] = await Promise.all([
      payload.find({
        collection: 'products',
        where: {
          and: [
            { id: { in: ids } },
            { _status: { equals: 'published' } },
            { lifecycle: { not_in: ['hidden', 'archived', 'draft'] } },
          ],
        },
        limit: ids.length,
        pagination: false,
        depth: 0,
        locale,
        select: { title: true, slug: true, brand: true, unit: true, legacyKey: true },
      }),
      payload.find({ collection: 'units', limit: 50, pagination: false, depth: 0 }),
      payload.find({ collection: 'brands', limit: 300, pagination: false, depth: 0 }),
    ])
    if (prods.docs.length === 0) return []
    const vars = await payload.find({
      collection: 'variations',
      where: { product: { in: prods.docs.map((p) => p.id) } },
      limit: 5000,
      pagination: false,
      depth: 0,
      locale,
      select: { product: true, sku: true, price: true, priceOnRequest: true, stockStatus: true, label: true },
    })

    type Stock = 'in_stock' | 'low_stock' | 'out_of_stock'
    const rank: Record<Stock, number> = { in_stock: 2, low_stock: 1, out_of_stock: 0 }
    const agg = new Map<
      number,
      { priceMin: number | null; stock: Stock; count: number; sku: string | null; label: string | null }
    >()
    for (const v of vars.docs) {
      const pid = typeof v.product === 'number' ? v.product : v.product.id
      const a = agg.get(pid) ?? { priceMin: null, stock: 'out_of_stock' as Stock, count: 0, sku: null, label: null }
      a.count += 1
      if (a.count === 1) {
        a.sku = v.sku
        a.label = v.label ?? null
      }
      if (!v.priceOnRequest && typeof v.price === 'number') {
        a.priceMin = a.priceMin == null ? v.price : Math.min(a.priceMin, v.price)
      }
      const s = (v.stockStatus ?? 'out_of_stock') as Stock
      if (rank[s] > rank[a.stock]) a.stock = s
      agg.set(pid, a)
    }
    const unitSymbol = new Map(units.docs.map((u) => [u.id, u.symbol || u.label || u.code]))
    const brandById = new Map(brands.docs.map((b) => [b.id, b]))
    const byId = new Map(prods.docs.map((p) => [p.id, p]))

    return ids.flatMap((id): ProductCardData[] => {
      const p = byId.get(id)
      if (!p) return []
      const a = agg.get(id) ?? { priceMin: null, stock: 'out_of_stock' as Stock, count: 0, sku: null, label: null }
      const bid = typeof p.brand === 'number' ? p.brand : p.brand?.id
      const uid = typeof p.unit === 'number' ? p.unit : p.unit?.id
      return [
        {
          id: String(id),
          slug: p.slug ?? '',
          title: p.title ?? '',
          brand: bid != null ? (brandById.get(bid)?.name ?? null) : null,
          sku: p.legacyKey ?? null,
          priceMin: a.priceMin,
          priceOnRequest: a.priceMin == null,
          stockStatus: a.stock,
          unit: uid != null ? (unitSymbol.get(uid) ?? null) : null,
          imageUrl: null,
          variationCount: a.count,
          defaultVariationSku: a.count === 1 ? a.sku : null,
          defaultVariationLabel: a.count === 1 ? a.label : null,
        },
      ]
    })
  } catch {
    return []
  }
}

export const getProductCards = (ids: number[], locale: 'ro' | 'ru' = 'ro'): Promise<ProductCardData[]> =>
  unstable_cache(loadProductCards, ['product-cards'], { revalidate: 300, tags: ['catalog'] })(ids, locale)

/* ------------------------------------------------------------------ */
/* Product page data.                                                  */
/* ------------------------------------------------------------------ */

import type { Product } from '@/payload-types'
import type { ProductVariationData } from './catalog-types'
import type { SpecRegistryEntry } from './specs'

const RELATION_RAILS: { field: keyof Product; title: string }[] = [
  { field: 'accessories', title: 'Accesorii recomandate' },
  { field: 'frequentlyBoughtTogether', title: 'Frecvent cumpărate împreună' },
  { field: 'similarProducts', title: 'Produse similare' },
  { field: 'consumables', title: 'Consumabile' },
  { field: 'compatibleProducts', title: 'Produse compatibile' },
  { field: 'replacementParts', title: 'Piese de schimb' },
  { field: 'betterAlternatives', title: 'Alternative mai bune' },
  { field: 'premiumAlternatives', title: 'Alternative premium' },
  { field: 'budgetAlternatives', title: 'Alternative economice' },
]

export interface ProductPageData {
  id: number
  slug: string
  title: string
  legacyKey: string | null
  brand: { name: string; slug: string } | null
  unitSymbol: string | null
  trail: { title: string; href: string }[]
  attributes: { key: string; value: string }[]
  registry: SpecRegistryEntry[]
  variations: ProductVariationData[]
  description: Product['description']
  faqs: { question: string; answer: string }[]
  rails: { title: string; ids: number[] }[]
  seo: { metaTitle?: string | null; metaDescription?: string | null }
}

const relationIds = (value: Product[keyof Product]): number[] =>
  Array.isArray(value)
    ? value
        .map((v) => (typeof v === 'number' ? v : typeof v === 'object' && v !== null && 'id' in v ? (v as { id: number }).id : null))
        .filter((n): n is number => typeof n === 'number')
    : []

const loadProductPageData = async (slug: string, locale: 'ro' | 'ru'): Promise<ProductPageData | null> => {
  try {
    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'products',
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
          { lifecycle: { not_in: ['hidden', 'archived', 'draft'] } },
        ],
      },
      limit: 1,
      depth: 0,
      locale,
    })
    const doc = found.docs[0]
    if (!doc) return null

    const [variations, registry, brands, units, categories] = await Promise.all([
      payload.find({
        collection: 'variations',
        where: { product: { equals: doc.id } },
        limit: 200,
        pagination: false,
        depth: 0,
        locale,
        sort: 'sku',
      }),
      payload.find({ collection: 'attributes', limit: 200, pagination: false, depth: 0, locale }),
      payload.find({ collection: 'brands', limit: 300, pagination: false, depth: 0 }),
      payload.find({ collection: 'units', limit: 50, pagination: false, depth: 0 }),
      payload.find({ collection: 'categories', limit: 500, pagination: false, depth: 0, locale }),
    ])

    const bid = typeof doc.brand === 'number' ? doc.brand : doc.brand?.id
    const brandDoc = bid != null ? brands.docs.find((b) => b.id === bid) : undefined
    const uid = typeof doc.unit === 'number' ? doc.unit : doc.unit?.id
    const unitDoc = uid != null ? units.docs.find((u) => u.id === uid) : undefined

    const byId = new Map(categories.docs.map((c) => [c.id, c]))
    const cid = typeof doc.category === 'number' ? doc.category : doc.category?.id
    const trail: { title: string; href: string }[] = []
    if (cid != null) {
      const chain: Category[] = []
      let cur = byId.get(cid)
      for (let i = 0; cur && i < 5; i++) {
        chain.unshift(cur)
        const pid = typeof cur.parent === 'number' ? cur.parent : cur.parent?.id
        cur = pid != null ? byId.get(pid) : undefined
      }
      const section = chain[0]
      for (const c of chain) {
        trail.push({
          title: c.title,
          href: c.level === 'section' ? `/category/${c.slug}` : `/category/${section.slug}/${c.slug}`,
        })
      }
    }

    return {
      id: doc.id,
      slug: doc.slug ?? slug,
      title: doc.title ?? '',
      legacyKey: doc.legacyKey ?? null,
      brand: brandDoc ? { name: brandDoc.name, slug: brandDoc.slug } : null,
      unitSymbol: unitDoc ? unitDoc.symbol || unitDoc.label || unitDoc.code : null,
      trail,
      attributes: (doc.attributes ?? []).map((a) => ({ key: a.key, value: a.value })),
      registry: registry.docs.map((a) => ({
        key: a.key,
        displayName: a.displayName,
        group: (a.group ?? 'general') as SpecRegistryEntry['group'],
        dataType: a.dataType ?? 'text',
        displayPriority: a.displayPriority ?? 999,
      })),
      variations: variations.docs.map(
        (v): ProductVariationData => ({
          sku: v.sku,
          price: typeof v.price === 'number' ? v.price : null,
          priceOnRequest: Boolean(v.priceOnRequest) || v.price == null,
          stockStatus: (v.stockStatus ?? 'out_of_stock') as ProductVariationData['stockStatus'],
          label: v.label ?? null,
          attributes: (v.attributes ?? []).map((a) => ({ type: a.type, value: a.value })),
        }),
      ),
      description: doc.description ?? null,
      faqs: (doc.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
      rails: RELATION_RAILS.map(({ field, title }) => ({ title, ids: relationIds(doc[field]) })).filter(
        (r) => r.ids.length > 0,
      ),
      seo: { metaTitle: doc.seo?.metaTitle, metaDescription: doc.seo?.metaDescription },
    }
  } catch {
    return null
  }
}

export const getProductPageData = (slug: string, locale: 'ro' | 'ru' = 'ro'): Promise<ProductPageData | null> =>
  unstable_cache(loadProductPageData, ['product-page'], { revalidate: 300, tags: ['catalog'] })(slug, locale)

/* ------------------------------------------------------------------ */
/* Brand pages.                                                        */
/* ------------------------------------------------------------------ */

export interface BrandIndexEntry {
  id: number
  name: string
  slug: string
  count: number
}

const loadBrandsIndex = async (): Promise<BrandIndexEntry[]> => {
  try {
    const payload = await getPayload({ config })
    const [brands, products] = await Promise.all([
      payload.find({
        collection: 'brands',
        where: { status: { equals: 'active' } },
        limit: 300,
        pagination: false,
        depth: 0,
        sort: 'name',
      }),
      payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        limit: 10000,
        pagination: false,
        depth: 0,
        select: { brand: true },
      }),
    ])
    const counts = new Map<number, number>()
    for (const p of products.docs) {
      const bid = typeof p.brand === 'number' ? p.brand : p.brand?.id
      if (bid != null) counts.set(bid, (counts.get(bid) ?? 0) + 1)
    }
    return brands.docs
      .map((b) => ({ id: b.id, name: b.name, slug: b.slug, count: counts.get(b.id) ?? 0 }))
      .filter((b) => b.count > 0)
  } catch {
    return []
  }
}

export const getBrandsIndex = (): Promise<BrandIndexEntry[]> =>
  unstable_cache(loadBrandsIndex, ['brands-index'], { revalidate: 300, tags: ['catalog'] })()

export const getBrandBySlug = (slug: string): Promise<BrandIndexEntry | null> =>
  unstable_cache(
    async (s: string) => (await loadBrandsIndex()).find((b) => b.slug === s) ?? null,
    ['brand-by-slug'],
    { revalidate: 300, tags: ['catalog'] },
  )(slug)

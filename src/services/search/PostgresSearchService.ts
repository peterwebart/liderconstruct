import type { Payload, Where } from 'payload'

import type { Category } from '../../payload-types'
import { aliasKey } from '../rules/text'
import type { SearchService } from './SearchService'
import type {
  Facet,
  FacetsResult,
  SearchDocument,
  SearchHit,
  SearchQuery,
  SearchResult,
  SuggestBrand,
  SuggestCategory,
  SuggestGroups,
  SuggestProduct,
} from './types'

const emptyGroups = (term: string): SuggestGroups => ({ term, products: [], brands: [], categories: [] })

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
const STOCK_RANK: Record<StockStatus, number> = { in_stock: 2, low_stock: 1, out_of_stock: 0 }

interface VariationAgg {
  priceMin: number | null
  stock: StockStatus
  count: number
  firstSku: string | null
  firstLabel: string | null
}

interface ResolvedContext {
  conditions: Where[]
  brandDocs: { id: number; name: string; slug: string; aliases?: string[] | null }[]
  categoryDocs: Category[]
}

/**
 * PostgreSQL-backed search behind the engine-agnostic SearchService interface
 * (ADR-0006). Ranking is tiered (exact/prefix SKU → folded text → popularity);
 * attribute filtering happens in memory over the context set — correct and
 * fast at this catalog's scale (~2.3k products), and the Meilisearch tier
 * replaces it behind the same interface. Typo tolerance arrives with pg_trgm
 * or Meilisearch; the contracts here won't change.
 */
export class PostgresSearchService implements SearchService {
  readonly engine = 'postgres'
  constructor(private readonly payload: Payload) {}

  /** Category scope: the node matching `slug` plus all its descendants. */
  private categoryScope(nodes: Category[], slug?: string): number[] | null {
    if (!slug) return null
    const root = nodes.find((c) => c.slug === slug)
    if (!root) return []
    const childrenOf = new Map<number, number[]>()
    for (const c of nodes) {
      const pid = typeof c.parent === 'number' ? c.parent : c.parent?.id
      if (pid != null) childrenOf.set(pid, [...(childrenOf.get(pid) ?? []), c.id])
    }
    const ids: number[] = []
    const queue = [root.id]
    while (queue.length) {
      const id = queue.shift() as number
      ids.push(id)
      queue.push(...(childrenOf.get(id) ?? []))
    }
    return ids
  }

  /** Shared context (published + lifecycle + category scope + term + brand).
   * Returns null when the context provably matches nothing. */
  private async resolveContext(query: SearchQuery): Promise<ResolvedContext | null> {
    const [brandDocs, categoryDocs] = await Promise.all([
      this.payload.find({ collection: 'brands', limit: 300, pagination: false, depth: 0 }),
      this.payload.find({
        collection: 'categories',
        limit: 500,
        pagination: false,
        depth: 0,
        locale: query.locale,
      }),
    ])

    const scopeSlug = query.categorySlug ?? query.sectionSlug
    const catIds = this.categoryScope(categoryDocs.docs, scopeSlug)
    if (catIds !== null && catIds.length === 0) return null

    const conditions: Where[] = [
      { _status: { equals: 'published' } },
      { lifecycle: { not_in: ['hidden', 'archived', 'draft'] } },
    ]
    if (catIds) conditions.push({ category: { in: catIds } })
    if (query.term) conditions.push({ searchText: { like: aliasKey(query.term) } })
    if (query.brandSlug) {
      const brand = brandDocs.docs.find((b) => b.slug === query.brandSlug)
      if (!brand) return null
      conditions.push({ brand: { equals: brand.id } })
    }

    return { conditions, brandDocs: brandDocs.docs, categoryDocs: categoryDocs.docs }
  }

  async instant(term: string, locale: 'ro' | 'ru'): Promise<SuggestGroups> {
    const raw = term.trim()
    const folded = aliasKey(raw)
    if (folded.length < 2) return emptyGroups(raw)

    // Tier 1 — exact / prefix SKU (variations are the SKU source of truth).
    const skuHits = await this.payload.find({
      collection: 'variations',
      where: { sku: { like: `${raw.toUpperCase().replace(/%/g, '')}%` } },
      limit: 3,
      depth: 0,
    })
    const skuProductIds = Array.from(
      new Set(skuHits.docs.map((v) => (typeof v.product === 'number' ? v.product : v.product.id))),
    )

    // Tier 2 — folded catalog text.
    const textHits = await this.payload.find({
      collection: 'products',
      where: {
        and: [
          { searchText: { like: folded } },
          { _status: { equals: 'published' } },
          { lifecycle: { not_in: ['hidden', 'archived', 'draft'] } },
        ],
      },
      limit: 6,
      depth: 0,
      locale,
      sort: '-popularity',
    })

    const productIds: number[] = []
    for (const id of [...skuProductIds, ...textHits.docs.map((d) => d.id)]) {
      if (!productIds.includes(id)) productIds.push(id)
    }
    const topIds = productIds.slice(0, 5)

    const [productDocs, variationDocs] = await Promise.all([
      topIds.length
        ? this.payload.find({
            collection: 'products',
            where: { id: { in: topIds } },
            limit: topIds.length,
            depth: 0,
            locale,
          })
        : Promise.resolve({
            docs: [] as { id: number; slug?: string | null; title?: string | null; legacyKey?: string | null }[],
          }),
      topIds.length
        ? this.payload.find({
            collection: 'variations',
            where: { product: { in: topIds } },
            limit: 200,
            pagination: false,
            depth: 0,
          })
        : Promise.resolve({
            docs: [] as {
              product: number | { id: number }
              price?: number | null
              priceOnRequest?: boolean | null
              stockStatus?: string | null
            }[],
          }),
    ])

    const byProduct = new Map<number, { priceMin: number | null; inStock: boolean }>()
    for (const v of variationDocs.docs) {
      const pid = typeof v.product === 'number' ? v.product : v.product.id
      const cur = byProduct.get(pid) ?? { priceMin: null, inStock: false }
      if (!v.priceOnRequest && typeof v.price === 'number') {
        cur.priceMin = cur.priceMin == null ? v.price : Math.min(cur.priceMin, v.price)
      }
      if (v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock') cur.inStock = true
      byProduct.set(pid, cur)
    }
    const docById = new Map(productDocs.docs.map((d) => [d.id, d]))
    const products: SuggestProduct[] = topIds
      .map((id): SuggestProduct | null => {
        const d = docById.get(id)
        if (!d) return null
        const agg = byProduct.get(id) ?? { priceMin: null, inStock: false }
        return {
          id: String(id),
          slug: d.slug ?? '',
          title: d.title ?? '',
          sku: d.legacyKey ?? null,
          priceMin: agg.priceMin,
          priceOnRequest: agg.priceMin == null,
          inStock: agg.inStock,
        }
      })
      .filter((p): p is SuggestProduct => p !== null)

    // Brands + categories: small reference sets, folded match incl. aliases.
    const [brandDocs, categoryDocs] = await Promise.all([
      this.payload.find({ collection: 'brands', limit: 300, pagination: false, depth: 0 }),
      this.payload.find({ collection: 'categories', limit: 500, pagination: false, depth: 0, locale }),
    ])

    const brandMatches = brandDocs.docs
      .filter(
        (b) =>
          aliasKey(b.name).includes(folded) || (b.aliases ?? []).some((a) => aliasKey(a).includes(folded)),
      )
      .slice(0, 3)
    const brands: SuggestBrand[] = await Promise.all(
      brandMatches.map(async (b) => ({
        id: String(b.id),
        slug: b.slug,
        name: b.name,
        count: (
          await this.payload.count({
            collection: 'products',
            where: { and: [{ brand: { equals: b.id } }, { _status: { equals: 'published' } }] },
          })
        ).totalDocs,
      })),
    )

    const nodeById = new Map<number, Category>(categoryDocs.docs.map((c) => [c.id, c]))
    const trail = (node: Category): Category[] => {
      const out: Category[] = [node]
      let cur = node
      for (let i = 0; i < 4; i++) {
        const pid = typeof cur.parent === 'number' ? cur.parent : cur.parent?.id
        if (pid == null) break
        const parent = nodeById.get(pid)
        if (!parent) break
        out.unshift(parent)
        cur = parent
      }
      return out
    }
    const categoryMatches = categoryDocs.docs
      .filter(
        (c) =>
          aliasKey(c.title).includes(folded) || (c.aliases ?? []).some((a) => aliasKey(a).includes(folded)),
      )
      .slice(0, 3)
    const categories: SuggestCategory[] = await Promise.all(
      categoryMatches.map(async (c) => {
        const chain = trail(c)
        const section = chain[0]
        const href =
          c.level === 'section' ? `/category/${section.slug}` : `/category/${section.slug}/${c.slug}`
        return {
          id: String(c.id),
          slug: c.slug,
          href,
          title: c.title,
          path: chain.map((n) => n.title).join(' › '),
          count: (
            await this.payload.count({
              collection: 'products',
              where: { and: [{ category: { equals: c.id } }, { _status: { equals: 'published' } }] },
            })
          ).totalDocs,
        }
      }),
    )

    return { term: raw, products, brands, categories }
  }

  /**
   * Registry-driven facets with counts for a catalog context (spec §5.4,
   * ADR-0004). Counts reflect the context (category/term/brand) before
   * attribute selections — per-facet exclusion counting arrives with the
   * Meilisearch tier.
   */
  async facets(query: SearchQuery): Promise<FacetsResult> {
    const empty: FacetsResult = {
      facets: [],
      priceRange: { min: null, max: null },
      stockCounts: { inStock: 0, total: 0 },
    }
    try {
      const [registry, ctx] = await Promise.all([
        this.payload.find({
          collection: 'attributes',
          where: { isFilterable: { equals: true } },
          sort: 'displayPriority',
          limit: 100,
          pagination: false,
          depth: 0,
          locale: query.locale,
        }),
        this.resolveContext(query),
      ])
      if (!ctx) return empty

      const prods = await this.payload.find({
        collection: 'products',
        where: { and: ctx.conditions },
        limit: 10000,
        pagination: false,
        depth: 0,
        locale: query.locale,
        select: { brand: true, attributes: true },
      })
      if (prods.docs.length === 0) return empty
      const prodIds = prods.docs.map((p) => p.id)

      const vars = await this.payload.find({
        collection: 'variations',
        where: { product: { in: prodIds } },
        limit: 30000,
        pagination: false,
        depth: 0,
        select: { product: true, price: true, priceOnRequest: true, stockStatus: true },
      })

      let min: number | null = null
      let max: number | null = null
      const stockByProduct = new Map<number, boolean>()
      for (const v of vars.docs) {
        const pid = typeof v.product === 'number' ? v.product : v.product.id
        if (!v.priceOnRequest && typeof v.price === 'number') {
          min = min == null ? v.price : Math.min(min, v.price)
          max = max == null ? v.price : Math.max(max, v.price)
        }
        if (v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock') stockByProduct.set(pid, true)
        else if (!stockByProduct.has(pid)) stockByProduct.set(pid, false)
      }
      const inStock = [...stockByProduct.values()].filter(Boolean).length

      const brandCount = new Map<number, number>()
      for (const p of prods.docs) {
        const bid = typeof p.brand === 'number' ? p.brand : p.brand?.id
        if (bid != null) brandCount.set(bid, (brandCount.get(bid) ?? 0) + 1)
      }
      const brandById = new Map(ctx.brandDocs.map((b) => [b.id, b]))
      const brandFacet: Facet = {
        key: '_brand',
        label: 'Brand',
        values: [...brandCount.entries()]
          .map(([id, count]) => {
            const b = brandById.get(id)
            return b ? { value: b.slug, label: b.name, count } : null
          })
          .filter((v): v is { value: string; label: string; count: number } => v !== null)
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
      }

      const registryByKey = new Map(registry.docs.map((a) => [a.key, a]))
      const valueCounts = new Map<string, Map<string, number>>()
      for (const p of prods.docs) {
        for (const a of p.attributes ?? []) {
          if (!a.key || !a.value || !registryByKey.has(a.key)) continue
          const m = valueCounts.get(a.key) ?? new Map<string, number>()
          m.set(a.value, (m.get(a.value) ?? 0) + 1)
          valueCounts.set(a.key, m)
        }
      }
      const attrFacets: Facet[] = registry.docs
        .map((a): Facet | null => {
          const m = valueCounts.get(a.key)
          if (!m || m.size === 0) return null
          return {
            key: a.key,
            label: a.displayName,
            values: [...m.entries()]
              .map(([value, count]) => ({ value, count }))
              .sort((x, y) => y.count - x.count)
              .slice(0, 24),
          }
        })
        .filter((f): f is Facet => f !== null)

      return {
        facets: [...(brandFacet.values.length ? [brandFacet] : []), ...attrFacets],
        priceRange: { min, max },
        stockCounts: { inStock, total: prods.docs.length },
      }
    } catch {
      return empty
    }
  }

  /**
   * Full listing search: context → aggregate variations → apply facet/price/
   * stock filters (AND across facets, OR within a facet) → sort → paginate.
   * Hits carry the complete ProductCard shape so pages render without extra
   * queries.
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(60, Math.max(1, query.pageSize ?? 24))
    const empty: SearchResult = { hits: [], total: 0, page, pageSize, facets: [] }
    try {
      const ctx = await this.resolveContext(query)
      if (!ctx) return empty

      const [prods, unitDocs] = await Promise.all([
        this.payload.find({
          collection: 'products',
          where: { and: ctx.conditions },
          limit: 10000,
          pagination: false,
          depth: 0,
          locale: query.locale,
          select: {
            title: true,
            slug: true,
            brand: true,
            unit: true,
            legacyKey: true,
            attributes: true,
            popularity: true,
            createdAt: true,
          },
        }),
        this.payload.find({ collection: 'units', limit: 50, pagination: false, depth: 0 }),
      ])
      if (prods.docs.length === 0) return empty

      const vars = await this.payload.find({
        collection: 'variations',
        where: { product: { in: prods.docs.map((p) => p.id) } },
        limit: 30000,
        pagination: false,
        depth: 0,
        locale: query.locale,
        select: { product: true, sku: true, price: true, priceOnRequest: true, stockStatus: true, label: true },
      })

      const agg = new Map<number, VariationAgg>()
      for (const v of vars.docs) {
        const pid = typeof v.product === 'number' ? v.product : v.product.id
        const a = agg.get(pid) ?? {
          priceMin: null,
          stock: 'out_of_stock' as StockStatus,
          count: 0,
          firstSku: null,
          firstLabel: null,
        }
        a.count += 1
        if (a.count === 1) {
          a.firstSku = v.sku
          a.firstLabel = v.label ?? null
        }
        if (!v.priceOnRequest && typeof v.price === 'number') {
          a.priceMin = a.priceMin == null ? v.price : Math.min(a.priceMin, v.price)
        }
        const s = (v.stockStatus ?? 'out_of_stock') as StockStatus
        if (STOCK_RANK[s] > STOCK_RANK[a.stock]) a.stock = s
        agg.set(pid, a)
      }

      const unitSymbol = new Map(unitDocs.docs.map((u) => [u.id, u.symbol || u.label || u.code]))
      const brandById = new Map(ctx.brandDocs.map((b) => [b.id, b]))

      const brandSel = new Set(query.filters?.find((f) => f.key === '_brand')?.values ?? [])
      const attrSel = (query.filters ?? []).filter((f) => f.key !== '_brand' && f.values.length > 0)

      let items = prods.docs.map((p) => {
        const a =
          agg.get(p.id) ??
          ({ priceMin: null, stock: 'out_of_stock', count: 0, firstSku: null, firstLabel: null } as VariationAgg)
        const bid = typeof p.brand === 'number' ? p.brand : p.brand?.id
        const uid = typeof p.unit === 'number' ? p.unit : p.unit?.id
        const brand = bid != null ? brandById.get(bid) : undefined
        return {
          doc: p,
          a,
          brandName: brand?.name ?? null,
          brandSlug: brand?.slug ?? null,
          unit: uid != null ? (unitSymbol.get(uid) ?? null) : null,
        }
      })

      if (brandSel.size > 0) items = items.filter((i) => i.brandSlug != null && brandSel.has(i.brandSlug))
      for (const sel of attrSel) {
        const want = new Set(sel.values)
        items = items.filter((i) =>
          (i.doc.attributes ?? []).some((at) => at.key === sel.key && at.value != null && want.has(at.value)),
        )
      }
      if (query.priceMin != null)
        items = items.filter((i) => i.a.priceMin != null && i.a.priceMin >= (query.priceMin as number))
      if (query.priceMax != null)
        items = items.filter((i) => i.a.priceMin != null && i.a.priceMin <= (query.priceMax as number))
      if (query.inStockOnly) items = items.filter((i) => i.a.stock !== 'out_of_stock')

      const sort = query.sort ?? 'relevance'
      const byTitle = (x: { doc: { title?: string | null } }, y: { doc: { title?: string | null } }): number =>
        String(x.doc.title ?? '').localeCompare(String(y.doc.title ?? ''), 'ro')
      if (sort === 'price_asc') {
        items.sort(
          (x, y) => (x.a.priceMin ?? Number.POSITIVE_INFINITY) - (y.a.priceMin ?? Number.POSITIVE_INFINITY) || byTitle(x, y),
        )
      } else if (sort === 'price_desc') {
        items.sort((x, y) => (y.a.priceMin ?? -1) - (x.a.priceMin ?? -1) || byTitle(x, y))
      } else if (sort === 'newest') {
        items.sort((x, y) => String(y.doc.createdAt ?? '').localeCompare(String(x.doc.createdAt ?? '')))
      } else {
        items.sort((x, y) => (y.doc.popularity ?? 0) - (x.doc.popularity ?? 0) || byTitle(x, y))
      }

      const total = items.length
      const slice = items.slice((page - 1) * pageSize, page * pageSize)
      const hits: SearchHit[] = slice.map((i) => ({
        id: String(i.doc.id),
        slug: i.doc.slug ?? '',
        title: i.doc.title ?? '',
        brand: i.brandName,
        sku: i.doc.legacyKey ?? null,
        priceMin: i.a.priceMin,
        priceOnRequest: i.a.priceMin == null,
        stockStatus: i.a.stock,
        inStock: i.a.stock !== 'out_of_stock',
        unit: i.unit,
        primaryImageUrl: null,
        variationCount: i.a.count,
        defaultVariationSku: i.a.count === 1 ? i.a.firstSku : null,
        defaultVariationLabel: i.a.count === 1 ? i.a.firstLabel : null,
      }))

      return { hits, total, page, pageSize, facets: [] }
    } catch {
      return empty
    }
  }

  async suggest(_term: string, _locale: 'ro' | 'ru'): Promise<string[]> {
    return []
  }

  async index(_documents: SearchDocument[]): Promise<void> {
    // PG keeps documents in-table (searchText); no external index to push.
  }

  async remove(_ids: string[]): Promise<void> {
    // No-op for the in-table PG index.
  }
}

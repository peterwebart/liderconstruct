import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { getSearchService } from '@/services/search'

import type { ProductCardData } from './catalog-types'
import { getProductCards } from './catalog'

/**
 * Homepage view model — resolved from the Homepage global + taxonomy.
 * Every section is CMS-driven with honest fallbacks: featured brands fall
 * back to the largest catalogs, the product strip falls back to a live
 * query, and empty blocks simply don't render.
 */

export interface HomepageBlockHeader {
  title: string | null
  subtitle: string | null
}

export interface HomepageFeaturedCategory {
  id: number
  title: string
  href: string
  icon: string | null
}

export interface HomepageData {
  stats: { products: number; brands: number }
  featuredCategories: { header: HomepageBlockHeader; items: HomepageFeaturedCategory[] } | null
  productStrip: { header: HomepageBlockHeader; items: ProductCardData[] } | null
  featuredBrandIds: number[]
}

const header = (block: { title?: string | null; subtitle?: string | null }): HomepageBlockHeader => ({
  title: block.title ?? null,
  subtitle: block.subtitle ?? null,
})

const toId = (v: number | { id: number }): number => (typeof v === 'number' ? v : v.id)

const loadHomepageData = async (locale: 'ro' | 'ru'): Promise<HomepageData> => {
  const empty: HomepageData = {
    stats: { products: 0, brands: 0 },
    featuredCategories: null,
    productStrip: null,
    featuredBrandIds: [],
  }
  try {
    const payload = await getPayload({ config })
    const [homepage, productCount, brandCount, categories] = await Promise.all([
      payload.findGlobal({ slug: 'homepage', depth: 0, locale }),
      payload.count({ collection: 'products', where: { _status: { equals: 'published' } } }),
      payload.count({ collection: 'brands', where: { status: { equals: 'active' } } }),
      payload.find({ collection: 'categories', limit: 500, pagination: false, depth: 0, locale }),
    ])
    const blocks = homepage.sections ?? []

    // Featured categories → tiles with canonical hrefs.
    const byId = new Map(categories.docs.map((c) => [c.id, c]))
    const sectionOf = (id: number): string | null => {
      let cur = byId.get(id)
      for (let i = 0; cur && i < 5; i++) {
        if (cur.level === 'section') return cur.slug
        const pid = typeof cur.parent === 'number' ? cur.parent : cur.parent?.id
        cur = pid != null ? byId.get(pid) : undefined
      }
      return null
    }
    const catBlock = blocks.find((b) => b.blockType === 'featuredCategories')
    let featuredCategories: HomepageData['featuredCategories'] = null
    if (catBlock && catBlock.blockType === 'featuredCategories') {
      const items = (catBlock.categories ?? [])
        .map(toId)
        .map((id): HomepageFeaturedCategory | null => {
          const c = byId.get(id)
          if (!c) return null
          const section = sectionOf(id)
          if (!section) return null
          return {
            id,
            title: c.title,
            href: c.level === 'section' ? `/category/${c.slug}` : `/category/${section}/${c.slug}`,
            icon: c.icon ?? null,
          }
        })
        .filter((x): x is HomepageFeaturedCategory => x !== null)
      if (items.length > 0) featuredCategories = { header: header(catBlock), items }
    }

    // Product strip: curated list wins; otherwise the auto query block;
    // otherwise a newest-first fallback so the homepage is never empty.
    let productStrip: HomepageData['productStrip'] = null
    const curated = blocks.find((b) => b.blockType === 'featuredProducts')
    if (curated && curated.blockType === 'featuredProducts') {
      const ids = (curated.products ?? []).map(toId)
      const items = await getProductCards(ids, locale)
      if (items.length > 0) productStrip = { header: header(curated), items }
    }
    if (!productStrip) {
      const auto = blocks.find((b) => b.blockType === 'productQuery')
      const source = auto && auto.blockType === 'productQuery' ? (auto.source ?? 'new') : 'new'
      const limit = auto && auto.blockType === 'productQuery' ? Math.min(12, auto.limit ?? 8) : 8
      const sort = source === 'popular' ? 'relevance' : 'newest'
      const result = await getSearchService(payload).search({ locale, sort, page: 1, pageSize: limit })
      if (result.hits.length > 0) {
        productStrip = {
          header:
            auto && auto.blockType === 'productQuery'
              ? header(auto)
              : { title: 'Produse din catalog', subtitle: null },
          items: result.hits.map((h) => ({
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
          })),
        }
      }
    }

    const brandBlock = blocks.find((b) => b.blockType === 'featuredBrands')
    const featuredBrandIds =
      brandBlock && brandBlock.blockType === 'featuredBrands' ? (brandBlock.brands ?? []).map(toId) : []

    return {
      stats: { products: productCount.totalDocs, brands: brandCount.totalDocs },
      featuredCategories,
      productStrip,
      featuredBrandIds,
    }
  } catch {
    return empty
  }
}

export const getHomepageData = (locale: 'ro' | 'ru' = 'ro'): Promise<HomepageData> =>
  unstable_cache(loadHomepageData, ['homepage-data'], {
    revalidate: 300,
    tags: ['navigation', 'catalog'],
  })(locale)

import type { Payload } from 'payload'

import type { Product, Variation } from '../../payload-types'
import { applySeoDefaults, computeProductStatus, defaultRulesConfig, type RulesConfig } from '../rules'
import type { MatchResult } from './matcher'
import { aliasKey, slugify } from './normalizer'
import type { ChangePlan } from './planner'
import type { CanonicalProduct, CanonicalVariation } from './types'

export interface Resolvers {
  /** aliasKey(value) -> record id */
  brands: Map<string, number>
  categories: Map<string, number>
  units: Map<string, number>
}
export const emptyResolvers = (): Resolvers => ({ brands: new Map(), categories: new Map(), units: new Map() })

export interface ExecutionResult {
  created: number
  updated: number
  skipped: number
  variationsWritten: number
}

type VariationAttributes = Variation['attributes']
type VariationAttributeType = NonNullable<VariationAttributes>[number]['type']

interface ProductWrite {
  legacyKey?: string | null
  title: string
  slug: string
  lifecycle: Product['lifecycle']
  needsReview?: boolean | null
  reviewNotes?: string | null
  applicationArea?: string | null
  brand?: number | null
  category?: number | null
  unit?: number | null
  attributes?: Product['attributes']
  seo?: Product['seo']
  keywords?: Product['keywords']
  searchText?: string | null
  _status?: Product['_status']
}

interface VariationPatch {
  product?: number
  sku?: string
  price?: number | null
  priceOnRequest?: boolean
  stockStatus?: Variation['stockStatus']
  attributes?: VariationAttributes
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Builds product data via the Business Rules engine (status + SEO). SEO is
 * generated only on create so manual edits always win on re-import. */
function productData(
  p: CanonicalProduct,
  r: Resolvers,
  includeSeo: boolean,
  config: RulesConfig,
): ProductWrite {
  const brandId = p.brandSource ? r.brands.get(aliasKey(p.brandSource)) : undefined
  const categoryId = p.categorySource ? r.categories.get(aliasKey(p.categorySource)) : undefined
  const unitId = p.unitSource ? r.units.get(aliasKey(p.unitSource)) : undefined

  const status = computeProductStatus(
    {
      variations: p.variations.map((v) => ({ priceOnRequest: v.priceOnRequest, stockStatus: v.stockStatus })),
      missing: { brand: !brandId, unit: !unitId, category: !categoryId },
    },
    config.status,
  )

  const searchText = Array.from(
    new Set(
      [
        p.title,
        p.brandSource,
        p.categorySource,
        p.legacyKey,
        p.applicationRo,
        p.applicationRu,
        ...p.variations.map((v) => v.sku),
        ...p.attributes.map((a) => a.value),
      ]
        .filter((x): x is string => Boolean(x))
        .map((x) => aliasKey(x)),
    ),
  ).join(' ')

  const data: ProductWrite = {
    legacyKey: p.legacyKey,
    title: p.title,
    slug: slugify(p.title),
    searchText,
    _status: 'published',
    lifecycle: status.lifecycle as Product['lifecycle'],
    needsReview: status.needsReview,
    reviewNotes: status.reasons.join('; ') || undefined,
    applicationArea: p.applicationRo ?? undefined,
    brand: brandId ?? undefined,
    category: categoryId ?? undefined,
    unit: unitId ?? undefined,
    attributes: p.attributes.map((a) => ({
      key: a.key,
      value: a.value,
      numericValue: a.numericValue ?? undefined,
    })),
  }

  if (includeSeo && config.seo.generateWhenEmpty) {
    const priced = p.variations.filter((v) => !v.priceOnRequest && v.price != null).map((v) => v.price as number)
    const priceMin = priced.length ? Math.min(...priced) : null
    const seo = applySeoDefaults(
      undefined,
      {
        name: p.title,
        brand: p.brandSource,
        slug: data.slug,
        priceMin,
        priceOnRequest: priceMin == null,
        keyAttributes: p.attributes.slice(0, 4).map((a) => a.value),
      },
      config.seo,
      config.defaultLocale,
      config.baseUrl,
    )
    data.seo = { metaTitle: seo.metaTitle, metaDescription: seo.metaDescription }
    data.keywords = seo.keywords
  }
  return data
}

function variationAttributes(v: CanonicalVariation): VariationAttributes {
  return v.attributes.map((a) => ({
    type: a.type as VariationAttributeType,
    value: a.value,
  }))
}

function variationPatch(v: CanonicalVariation, productId: number, scope: ChangePlan['variationFieldScope']): VariationPatch {
  if (scope === 'price') return { price: v.price ?? undefined, priceOnRequest: v.priceOnRequest }
  if (scope === 'stock') return { stockStatus: v.stockStatus }
  return {
    product: productId,
    sku: v.sku,
    price: v.price ?? undefined,
    priceOnRequest: v.priceOnRequest,
    stockStatus: v.stockStatus,
    attributes: variationAttributes(v),
  }
}

async function upsertVariation(
  payload: Payload,
  v: CanonicalVariation,
  productId: number,
  scope: ChangePlan['variationFieldScope'],
): Promise<void> {
  if (scope === 'none') return
  const existing = await payload.find({ collection: 'variations', where: { sku: { equals: v.sku } }, limit: 1, depth: 0 })
  const found = existing.docs[0]
  if (found) {
    await payload.update({ collection: 'variations', id: found.id, data: variationPatch(v, productId, scope), depth: 0 })
  } else if (scope === 'all') {
    await payload.create({
      collection: 'variations',
      data: {
        product: productId,
        sku: v.sku,
        price: v.price ?? undefined,
        priceOnRequest: v.priceOnRequest,
        stockStatus: v.stockStatus,
        attributes: variationAttributes(v),
      },
      depth: 0,
    })
  }
}

/**
 * Applies a plan in batches. Field scope enforces price-only / stock-only /
 * product-only safety. Per-record errors are collected by the caller; one bad
 * row never stops the run. All transformation/status/SEO is delegated to the
 * Business Rules layer.
 */
export async function executePlan(
  payload: Payload,
  match: MatchResult,
  plan: ChangePlan,
  resolvers: Resolvers = emptyResolvers(),
  config: RulesConfig = defaultRulesConfig,
  batchSize = 500,
): Promise<ExecutionResult> {
  const res: ExecutionResult = { created: 0, updated: 0, skipped: 0, variationsWritten: 0 }

  if (plan.productFieldScope === 'all') {
    for (const batch of chunk(match.toCreate, batchSize)) {
      for (const p of batch) {
        const created = await payload.create({ collection: 'products', data: productData(p, resolvers, true, config), depth: 0 })
        res.created++
        for (const v of p.variations) {
          await upsertVariation(payload, v, created.id, plan.variationFieldScope)
          res.variationsWritten++
        }
      }
    }
  }

  for (const batch of chunk(match.toUpdate, batchSize)) {
    for (const { product, existingId } of batch) {
      if (plan.productFieldScope === 'all') {
        await payload.update({ collection: 'products', id: existingId, data: productData(product, resolvers, false, config), depth: 0 })
        res.updated++
      }
      for (const v of product.variations) {
        await upsertVariation(payload, v, existingId, plan.variationFieldScope)
        res.variationsWritten++
      }
    }
  }

  return res
}

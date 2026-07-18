import type { SheetData } from '../adapters/SourceAdapter'
import type {
  CanonicalProduct,
  CanonicalVariation,
  CanonicalVariationAttribute,
  RawRow,
} from '../types'
import { normalizeProductName, normalizeText, parseNumber, slugify } from '../normalizer'

/** Diagnostics surfaced by the mapper for the validator to turn into issues. */
export interface MapperDiagnostics {
  duplicateSkuRows: { sku: string; rowNumbers: number[] }[]
  multiReferencedSkus: { sku: string; products: string[] }[]
  orphanSkus: string[]
  danglingRefs: { legacyKey: string; sku: string }[]
  testRowsExcluded: number
  /** Source rows sharing a base SKU (legacyKey), collapsed into one product. */
  collapsedDuplicates: { legacyKey: string; title: string; rowNumbers: number[] }[]
}
export interface MapResult {
  products: CanonicalProduct[]
  diagnostics: MapperDiagnostics
  variationRowCount: number
}

const PRODUCT_CORE = new Set([
  'Denumire',
  'Categorie',
  'Variații',
  'Brand',
  'Unitate masura',
  'Tara de origine',
  'Domeniu de aplicare',
  'Область применения',
])
const VARIATION_TYPE_MAP: Record<string, string> = {
  Foaia: 'sheet',
  'Ambalare kg': 'packaging_kg',
  'Ambalare Litri': 'packaging_litres',
  Grosime: 'thickness',
  Lungime: 'length',
  Mărime: 'size',
  '1 m2': 'per_m2',
  'Deschidere usi metalice': 'door_opening',
  'Dimensiuni usa interior': 'door_dimensions',
  Ochiul: 'eyelet',
  Culoare: 'colour',
  Cantitate: 'quantity',
}

const baseSku = (sku: string): string => sku.replace(/\/\d+$/, '')
const isTest = (name: string | null): boolean => !!name && /test/i.test(name)

/**
 * Enforces the "one product per legacyKey" invariant the executor relies on
 * (legacyKey is unique in the DB). Two source rows sharing a base SKU are the
 * same product identity, so we merge them into the first occurrence — union
 * variations by SKU, keep the first non-empty value per attribute key, OR the
 * review flag — rather than emitting a second row that would fail the unique
 * constraint at write time. Returns the collapsed list plus a report of what
 * was merged.
 */
function collapseByLegacyKey(products: CanonicalProduct[]): {
  products: CanonicalProduct[]
  collapsed: { legacyKey: string; title: string; rowNumbers: number[] }[]
} {
  const byKey = new Map<string, CanonicalProduct>()
  const mergedRows = new Map<string, number[]>()

  for (const p of products) {
    const existing = byKey.get(p.legacyKey)
    if (!existing) {
      byKey.set(p.legacyKey, p)
      continue
    }

    // Merge p into existing.
    const seenSkus = new Set(existing.variations.map((v) => v.sku))
    for (const v of p.variations) {
      if (!seenSkus.has(v.sku)) {
        existing.variations.push(v)
        seenSkus.add(v.sku)
      }
    }
    const seenVariationSkus = new Set(existing.variationSkus)
    for (const sku of p.variationSkus) {
      if (!seenVariationSkus.has(sku)) {
        existing.variationSkus.push(sku)
        seenVariationSkus.add(sku)
      }
    }
    const seenAttrKeys = new Set(existing.attributes.map((a) => a.key))
    for (const a of p.attributes) {
      if (!seenAttrKeys.has(a.key)) {
        existing.attributes.push(a)
        seenAttrKeys.add(a.key)
      }
    }
    existing.brandSource = existing.brandSource ?? p.brandSource
    existing.categorySource = existing.categorySource ?? p.categorySource
    existing.unitSource = existing.unitSource ?? p.unitSource
    existing.countryOfOrigin = existing.countryOfOrigin ?? p.countryOfOrigin
    existing.applicationRo = existing.applicationRo ?? p.applicationRo
    existing.applicationRu = existing.applicationRu ?? p.applicationRu
    existing.needsReview = true
    if (!existing.reviewNotes.includes('merged duplicate legacyKey')) {
      existing.reviewNotes.push('merged duplicate legacyKey')
    }

    mergedRows.set(
      p.legacyKey,
      [...(mergedRows.get(p.legacyKey) ?? [existing.rowNumber]), p.rowNumber],
    )
  }

  const collapsed = [...mergedRows.entries()].map(([legacyKey, rowNumbers]) => ({
    legacyKey,
    title: byKey.get(legacyKey)?.title ?? '',
    rowNumbers: [...new Set(rowNumbers)].sort((a, b) => a - b),
  }))
  return { products: [...byKey.values()], collapsed }
}

function buildVariation(row: RawRow, rowNumber: number): CanonicalVariation {
  const sku = String(normalizeText(row['SKU']) ?? '')
  const price = parseNumber(row['Pret'], '.')
  const attributes: CanonicalVariationAttribute[] = []
  for (const [header, type] of Object.entries(VARIATION_TYPE_MAP)) {
    const value = normalizeText(row[header])
    if (value) attributes.push({ type, value })
  }
  return {
    sku,
    price: price && price > 0 ? price : null,
    priceOnRequest: !(price && price > 0),
    stockStatus: 'in_stock',
    attributes,
    rowNumber,
  }
}

/**
 * Maps the LiderConstruct two-sheet export to canonical products. The product→
 * variation link is the comma-separated SKU list in Produse["Variații"]; SKU is
 * the synchronization key.
 */
export function mapLiderConstruct(sheets: SheetData[]): MapResult {
  const produse = sheets.find((s) => s.name.toLowerCase().startsWith('produse'))
  const variatii = sheets.find((s) => s.name.toLowerCase().startsWith('varia'))
  if (!produse || !variatii) {
    throw new Error('Expected sheets "Produse" and "Variații".')
  }

  // Index variation rows by SKU; record duplicates.
  const skuToVariation = new Map<string, CanonicalVariation>()
  const skuRowNumbers = new Map<string, number[]>()
  variatii.rows.forEach((row, i) => {
    const rowNumber = i + 2
    const sku = String(normalizeText(row['SKU']) ?? '')
    if (!sku) return
    skuRowNumbers.set(sku, [...(skuRowNumbers.get(sku) ?? []), rowNumber])
    if (!skuToVariation.has(sku)) skuToVariation.set(sku, buildVariation(row, rowNumber))
  })
  const duplicateSkuRows = [...skuRowNumbers.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([sku, rowNumbers]) => ({ sku, rowNumbers }))

  const products: CanonicalProduct[] = []
  const referencedBy = new Map<string, string[]>()
  const danglingRefs: { legacyKey: string; sku: string }[] = []
  let testRowsExcluded = 0

  produse.rows.forEach((row, i) => {
    const rowNumber = i + 2
    const title = normalizeProductName(row['Denumire'])
    if (!title) return
    if (isTest(title)) {
      testRowsExcluded++
      return
    }

    const variationSkus = String(normalizeText(row['Variații']) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const legacyKey = variationSkus.length ? baseSku(variationSkus[0]) : `name-${slugify(title)}`

    const variations: CanonicalVariation[] = []
    for (const sku of variationSkus) {
      const v = skuToVariation.get(sku)
      if (v) {
        variations.push(v)
        referencedBy.set(sku, [...(referencedBy.get(sku) ?? []), legacyKey])
      } else {
        danglingRefs.push({ legacyKey, sku })
      }
    }

    const attributes = Object.keys(row)
      .filter((h) => !PRODUCT_CORE.has(h))
      .map((h) => {
        const value = normalizeText(row[h])
        if (!value) return null
        return { key: slugify(h), label: h, value, numericValue: parseNumber(value, '.') }
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)

    let unitSource = normalizeText(row['Unitate masura'])
    if (unitSource && /^marime$/i.test(unitSource)) unitSource = null // bogus unit

    const brandSource = normalizeText(row['Brand'])
    const categorySource = normalizeText(row['Categorie'])
    const reviewNotes: string[] = []
    if (!brandSource) reviewNotes.push('missing brand')
    if (!unitSource) reviewNotes.push('missing unit')
    if (!categorySource) reviewNotes.push('missing category')
    if (variations.length === 0) reviewNotes.push('no resolvable variations')

    products.push({
      legacyKey,
      title,
      categorySource,
      brandSource,
      unitSource,
      countryOfOrigin: normalizeText(row['Tara de origine']),
      applicationRo: normalizeText(row['Domeniu de aplicare']),
      applicationRu: normalizeText(row['Область применения']),
      attributes,
      variationSkus,
      variations,
      needsReview: reviewNotes.length > 0,
      reviewNotes,
      rowNumber,
    })
  })

  const { products: collapsedProducts, collapsed } = collapseByLegacyKey(products)

  const multiReferencedSkus = [...referencedBy.entries()]
    .filter(([, p]) => new Set(p).size > 1)
    .map(([sku, p]) => ({ sku, products: [...new Set(p)] }))
  const orphanSkus = [...skuToVariation.keys()].filter(
    (sku) => !referencedBy.has(sku) && !isTest(skuToVariation.get(sku)?.sku ?? null),
  )

  return {
    products: collapsedProducts,
    variationRowCount: variatii.rows.length,
    diagnostics: {
      duplicateSkuRows,
      multiReferencedSkus,
      orphanSkus,
      danglingRefs,
      testRowsExcluded,
      collapsedDuplicates: collapsed,
    },
  }
}

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import approvedAliases from '../../seed/category-aliases.json'
import { aliasKey, computeProductStatus, defaultRulesConfig } from '../rules'
import { SpreadsheetAdapter } from './adapters/SpreadsheetAdapter'
import { findDuplicateCandidates } from './deduplicator'
import { mapLiderConstruct } from './profiles/liderconstruct'
import type { ImportReport, MappingReport, UnmappedValue } from './types'
import { countMissing, summarizeIssues, validate } from './validator'

function distinctCounts(values: (string | null)[]): UnmappedValue[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Executes the read-only pipeline (adapter -> mapper -> validator -> dedup ->
 * mapping/statistics) and returns a complete report. No writes, no DB. With no
 * alias maps seeded, every supplier category/brand/unit is reported as unmapped
 * (the mapping engine reports unknowns, never silently creates them).
 */
export function dryRun(filePath: string, format = 'ods'): ImportReport {
  const started = Date.now()
  const checksum = createHash('sha256').update(readFileSync(filePath)).digest('hex')

  const sheets = new SpreadsheetAdapter(format).read(filePath)
  const produse = sheets.find((s) => s.name.toLowerCase().startsWith('produse'))
  const productRows = produse?.rows.length ?? 0

  const result = mapLiderConstruct(sheets)
  const { products } = result
  const issues = validate(result, filePath)
  const duplicates = findDuplicateCandidates(products)

  const referencedSkus = new Set<string>()
  let priceOnRequest = 0
  let variationTotal = 0
  let maxVar = 0
  for (const p of products) {
    maxVar = Math.max(maxVar, p.variations.length)
    for (const v of p.variations) {
      if (!referencedSkus.has(v.sku)) {
        referencedSkus.add(v.sku)
        variationTotal++
        if (v.priceOnRequest) priceOnRequest++
      }
    }
  }
  const missing = countMissing(products)

  // Apply the Business Rules status engine + approved category aliases.
  const approvedKeys = new Set((approvedAliases as { supplier: string }[]).map((a) => aliasKey(a.supplier)))
  const statusBreakdown: Record<string, number> = {}
  let needsReviewCount = 0
  let mappedProducts = 0
  const mappedCatSet = new Set<string>()
  const pendingCatSet = new Set<string>()
  for (const p of products) {
    const categoryMapped = !!p.categorySource && approvedKeys.has(aliasKey(p.categorySource))
    if (p.categorySource) (categoryMapped ? mappedCatSet : pendingCatSet).add(aliasKey(p.categorySource))
    if (categoryMapped) mappedProducts += 1
    const status = computeProductStatus(
      {
        variations: p.variations.map((v) => ({ priceOnRequest: v.priceOnRequest, stockStatus: v.stockStatus })),
        missing: { brand: !p.brandSource, unit: !p.unitSource, category: !categoryMapped },
      },
      defaultRulesConfig.status,
    )
    statusBreakdown[status.lifecycle] = (statusBreakdown[status.lifecycle] ?? 0) + 1
    if (status.needsReview) needsReviewCount += 1
  }

  const mapping: MappingReport = {
    unmappedCategories: distinctCounts(products.map((p) => p.categorySource)),
    unmappedBrands: distinctCounts(products.map((p) => p.brandSource)),
    unmappedUnits: distinctCounts(products.map((p) => p.unitSource)),
  }

  const durationMs = Date.now() - started
  return {
    sourceFile: filePath.split('/').pop() ?? filePath,
    checksum,
    format,
    statistics: {
      productRows,
      variationRows: result.variationRowCount,
      uniqueProducts: new Set(products.map((p) => p.legacyKey)).size,
      importableProducts: products.length,
      importableVariations: variationTotal,
      multiVariationProducts: products.filter((p) => p.variations.length > 1).length,
      maxVariationsPerProduct: maxVar,
      avgVariationsPerProduct: products.length ? Math.round((variationTotal / products.length) * 100) / 100 : 0,
      missingBrand: missing.missingBrand,
      missingUnit: missing.missingUnit,
      missingCategory: missing.missingCategory,
      priceOnRequest,
      distinctCategories: mapping.unmappedCategories.length,
      distinctBrands: mapping.unmappedBrands.length,
      distinctUnits: mapping.unmappedUnits.length,
    },
    issues,
    issueSummary: summarizeIssues(issues),
    statusBreakdown,
    needsReviewCount,
    categoryMapping: {
      mappedCategories: mappedCatSet.size,
      pendingCategories: pendingCatSet.size,
      mappedProducts,
      pendingProducts: products.length - mappedProducts,
    },
    duplicates,
    mapping,
    performance: {
      durationMs,
      rowsPerSecond: durationMs ? Math.round(((productRows + result.variationRowCount) / durationMs) * 1000) : 0,
    },
  }
}

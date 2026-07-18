import type { MapResult } from './profiles/liderconstruct'
import type { CanonicalProduct, ValidationIssue } from './types'

/**
 * Turns mapper diagnostics + product completeness into structured issues.
 * Integrity errors are quarantined/skipped (never stop the run); missing
 * metadata is a warning (the product still imports, flagged for review).
 */
export function validate(result: MapResult, sourceFile: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { diagnostics, products } = result

  for (const d of diagnostics.duplicateSkuRows) {
    issues.push({
      level: 'error',
      code: 'DUPLICATE_SKU',
      action: 'quarantine',
      sku: d.sku,
      message: `SKU ${d.sku} appears on ${d.rowNumbers.length} variation rows (${d.rowNumbers.join(', ')}).`,
      suggestedFix: 'Assign a unique SKU per variation; remove the duplicate row.',
      sourceFile,
    })
  }
  for (const m of diagnostics.multiReferencedSkus) {
    issues.push({
      level: 'error',
      code: 'SKU_MULTI_PRODUCT',
      action: 'quarantine',
      sku: m.sku,
      message: `SKU ${m.sku} is referenced by ${m.products.length} products (${m.products.join(', ')}).`,
      suggestedFix: 'A variation must belong to exactly one product.',
      sourceFile,
    })
  }
  for (const sku of diagnostics.orphanSkus) {
    issues.push({
      level: 'warning',
      code: 'ORPHAN_VARIATION',
      action: 'warning',
      sku,
      message: `Variation ${sku} is not referenced by any product.`,
      suggestedFix: 'Attach to a product or remove.',
      sourceFile,
    })
  }
  for (const c of diagnostics.collapsedDuplicates) {
    issues.push({
      level: 'warning',
      code: 'DUPLICATE_LEGACY_KEY_MERGED',
      action: 'warning',
      sku: c.legacyKey,
      message: `Multiple source rows shared base SKU ${c.legacyKey} (rows ${c.rowNumbers.join(', ')}); merged into one product.`,
      suggestedFix: 'Give each distinct product a unique base SKU; if they are the same product, keep a single row.',
      sourceFile,
    })
  }
  for (const r of diagnostics.danglingRefs) {
    issues.push({
      level: 'warning',
      code: 'DANGLING_REF',
      action: 'warning',
      sku: r.sku,
      message: `Product ${r.legacyKey} references SKU ${r.sku} which is not in the variations sheet.`,
      sourceFile,
    })
  }

  for (const p of products) {
    if (p.needsReview) {
      issues.push({
        level: 'warning',
        code: 'INCOMPLETE_PRODUCT',
        action: 'warning',
        rowNumber: p.rowNumber,
        sku: p.legacyKey,
        message: `Product "${p.title}" imported with gaps: ${p.reviewNotes.join('; ')}.`,
        suggestedFix: 'Resolve missing brand/unit/category mapping.',
        sourceFile,
      })
    }
    for (const v of p.variations) {
      if (!v.priceOnRequest && v.price != null && v.price < 1) {
        issues.push({
          level: 'warning',
          code: 'SUSPICIOUS_PRICE',
          action: 'warning',
          sku: v.sku,
          rowNumber: v.rowNumber,
          field: 'price',
          message: `Suspiciously low price ${v.price} for ${v.sku}.`,
          sourceFile,
        })
      }
    }
  }

  return issues
}

export function summarizeIssues(issues: ValidationIssue[]): Record<string, number> {
  return issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.code] = (acc[i.code] ?? 0) + 1
    return acc
  }, {})
}

export function countMissing(products: CanonicalProduct[]) {
  return {
    missingBrand: products.filter((p) => !p.brandSource).length,
    missingUnit: products.filter((p) => !p.unitSource).length,
    missingCategory: products.filter((p) => !p.categorySource).length,
  }
}

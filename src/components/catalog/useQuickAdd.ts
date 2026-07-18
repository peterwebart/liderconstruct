'use client'

import { useCallback, useRef, useState } from 'react'

import type { ProductCardData } from '@/lib/catalog-types'
import { useQuote } from '@/components/quote/QuoteProvider'

/**
 * Card-level add: only single-variation products can be added directly
 * (the ordering model requires picking the variation first — spec flow F);
 * multi-variation cards link to the product page instead.
 */
export function useQuickAdd(product: ProductCardData): {
  canQuickAdd: boolean
  added: boolean
  add: () => void
} {
  const quote = useQuote()
  const [added, setAdded] = useState(false)
  const timer = useRef<number | null>(null)

  const canQuickAdd = product.variationCount <= 1 && Boolean(product.defaultVariationSku)

  const add = useCallback(() => {
    if (!product.defaultVariationSku) return
    quote.add({
      sku: product.defaultVariationSku,
      productSlug: product.slug,
      title: product.title,
      variationLabel: product.defaultVariationLabel ?? undefined,
      unitPrice: product.priceOnRequest ? null : product.priceMin,
      priceOnRequest: product.priceOnRequest,
      quantity: 1,
    })
    setAdded(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAdded(false), 1400)
  }, [product, quote])

  return { canQuickAdd, added, add }
}

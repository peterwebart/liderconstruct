'use client'

import { useCallback, useRef, useState } from 'react'

import { useQuote } from '@/components/quote/QuoteProvider'
import type { ProductCardData, ProductCardVariation } from '@/lib/catalog-types'

/**
 * Card-level add-to-cart. The cart line is always keyed by VARIATION SKU (a
 * product alone is not sellable), so the caller passes the selected variation
 * and quantity from the card's own controls.
 */
export function useQuickAdd(product: ProductCardData): {
  added: boolean
  add: (variation: ProductCardVariation | null, quantity: number) => void
} {
  const quote = useQuote()
  const [added, setAdded] = useState(false)
  const timer = useRef<number | null>(null)

  const add = useCallback(
    (variation: ProductCardVariation | null, quantity: number) => {
      if (!variation) return
      quote.add({
        sku: variation.sku,
        productSlug: product.slug,
        title: product.title,
        variationLabel: variation.label ?? undefined,
        unitPrice: variation.priceOnRequest ? null : variation.price,
        priceOnRequest: variation.priceOnRequest,
        quantity: Math.max(1, Math.round(quantity)),
      })
      setAdded(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setAdded(false), 1600)
    },
    [product.slug, product.title, quote],
  )

  return { added, add }
}

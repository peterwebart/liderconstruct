'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Inquiry-cart store (ADR-0002): lines live in the browser, no login. Persists
 * to localStorage; totals are estimates — the server recomputes on submit.
 */

export interface QuoteItem {
  sku: string
  productSlug: string
  title: string
  variationLabel?: string
  unitPrice: number | null
  priceOnRequest: boolean
  quantity: number
}

interface QuoteContextValue {
  items: QuoteItem[]
  count: number
  estimatedTotal: number
  add: (item: QuoteItem) => void
  remove: (sku: string) => void
  setQuantity: (sku: string, quantity: number) => void
  clear: () => void
}

const STORAGE_KEY = 'lc:quote:v1'
const QuoteContext = createContext<QuoteContextValue | null>(null)

function isQuoteItem(x: unknown): x is QuoteItem {
  if (typeof x !== 'object' || x === null) return false
  const i = x as Record<string, unknown>
  return typeof i.sku === 'string' && typeof i.title === 'string' && typeof i.quantity === 'number'
}

export function QuoteProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [items, setItems] = useState<QuoteItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setItems(parsed.filter(isQuoteItem))
    } catch {
      /* corrupt/unavailable storage — start empty */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage full/unavailable — cart stays in memory */
    }
  }, [items, hydrated])

  const add = useCallback((item: QuoteItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === item.sku)
      if (existing) {
        return prev.map((i) =>
          i.sku === item.sku ? { ...i, quantity: i.quantity + item.quantity } : i,
        )
      }
      return [...prev, item]
    })
  }, [])

  const remove = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku))
  }, [])

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, quantity: Math.max(1, Math.round(quantity)) } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<QuoteContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0)
    const estimatedTotal =
      Math.round(
        items.reduce((s, i) => s + (i.priceOnRequest || i.unitPrice == null ? 0 : i.unitPrice * i.quantity), 0) * 100,
      ) / 100
    return { items, count, estimatedTotal, add, remove, setQuantity, clear }
  }, [items, add, remove, setQuantity, clear])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

/** Null-safe variant for shells (Header) that may render outside the provider. */
export function useQuoteOptional(): QuoteContextValue | null {
  return useContext(QuoteContext)
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote must be used within <QuoteProvider>')
  return ctx
}

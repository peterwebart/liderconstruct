'use client'

import { Check, Package, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'

import { LocaleLink as Link } from '@/components/nav/LocaleLink'
import { PriceDisplay, QuantityStepper, Skeleton } from '@/components/ui'
import type { ProductCardData, ProductCardVariation } from '@/lib/catalog-types'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

import { useQuickAdd } from './useQuickAdd'

/** Variations shown as inline selectable rows before switching to a picker. */
const INLINE_LIMIT = 3

/**
 * Listing card. Deliberately commercial and compact: image, product name (up
 * to 3 lines), the available VARIATIONS with their prices, quantity, and
 * add-to-cart. Brand, SKU and stock text live on the product page — the card
 * carries only what a buyer needs to choose and order.
 *
 * Variation UX scales with count: one variation shows just its price; 2–3
 * render as inline selectable rows ("25 kg — 125 lei"); more collapse into a
 * compact picker. If the product has more variations than the server cap, the
 * card links to the product page for the remainder.
 */
export function ProductCard({ product }: { product: ProductCardData }): React.JSX.Element {
  const href = `/products/${product.slug}`
  // Memoized so the fallback array doesn't change identity every render.
  const variations = useMemo(() => product.variations ?? [], [product.variations])
  const [selectedSku, setSelectedSku] = useState<string | null>(product.variations?.[0]?.sku ?? null)
  const [quantity, setQuantity] = useState(1)
  const { added, add } = useQuickAdd(product)

  const selected: ProductCardVariation | null = useMemo(
    () => variations.find((v) => v.sku === selectedSku) ?? variations[0] ?? null,
    [variations, selectedSku],
  )

  const hasMore = product.variationCount > variations.length
  const multi = variations.length > 1

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface',
        'transition-all duration-150 hover:border-faint motion-safe:hover:-translate-y-0.5',
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-blueprint">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Package className="size-8 text-border" aria-hidden />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={href} className="block">
          {/* 3 lines, reserved height so prices/controls never shift. */}
          <h3 className="line-clamp-3 min-h-[3.75rem] text-sm leading-snug text-fg transition-colors group-hover:text-accent">
            {product.title}
          </h3>
        </Link>

        {variations.length === 0 ? (
          <PriceDisplay
            amount={product.priceMin}
            onRequest={product.priceOnRequest}
            perUnit={product.unit}
            size="sm"
          />
        ) : !multi ? (
          <PriceDisplay
            amount={variations[0].price}
            onRequest={variations[0].priceOnRequest}
            perUnit={product.unit}
            size="sm"
          />
        ) : variations.length <= INLINE_LIMIT ? (
          <div role="radiogroup" aria-label="Variante disponibile" className="space-y-1">
            {variations.map((v) => {
              const active = v.sku === selected?.sku
              return (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedSku(v.sku)}
                  className={cn(
                    'flex w-full items-baseline justify-between gap-2 rounded-control border px-2 py-1 text-left transition-colors',
                    active
                      ? 'border-accent bg-surface-2'
                      : 'border-transparent hover:border-border hover:bg-surface-2',
                  )}
                >
                  <span className="truncate text-xs text-muted">{v.label ?? v.sku}</span>
                  <span className="shrink-0 font-mono text-xs text-fg">
                    {v.priceOnRequest || v.price == null ? 'la cerere' : formatMoney(v.price)}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1">
            <label className="sr-only" htmlFor={`var-${product.id}`}>
              Alege varianta
            </label>
            <select
              id={`var-${product.id}`}
              value={selected?.sku ?? ''}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="h-9 w-full rounded-control border border-border bg-surface-2 px-2 text-xs text-fg outline-none transition-colors focus:border-accent"
            >
              {variations.map((v) => (
                <option key={v.sku} value={v.sku}>
                  {(v.label ?? v.sku) +
                    ' — ' +
                    (v.priceOnRequest || v.price == null ? 'preț la cerere' : formatMoney(v.price))}
                </option>
              ))}
            </select>
            {selected && (
              <PriceDisplay
                amount={selected.price}
                onRequest={selected.priceOnRequest}
                perUnit={product.unit}
                size="sm"
              />
            )}
          </div>
        )}

        {hasMore && (
          <Link href={href} className="text-[11px] text-accent hover:underline">
            Vezi toate variantele ({product.variationCount})
          </Link>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <QuantityStepper size="sm" value={quantity} onChange={setQuantity} />
          <button
            type="button"
            onClick={() => add(selected, quantity)}
            disabled={!selected}
            aria-label={`Adaugă ${product.title} în comandă`}
            className={cn(
              'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-control text-xs font-medium transition-colors',
              added ? 'bg-stock-in text-fg' : 'bg-accent text-accent-fg hover:bg-accent-600 disabled:opacity-50',
            )}
          >
            {added ? (
              <>
                <Check className="size-3.5" aria-hidden />
                Adăugat
              </>
            ) : (
              <>
                <ShoppingCart className="size-3.5" aria-hidden />
                Adaugă
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton(): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  )
}

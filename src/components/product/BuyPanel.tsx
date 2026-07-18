'use client'

import { ArrowLeftRight, Check, Phone, Plus } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import { Button, buttonVariants, PriceDisplay, QuantityStepper, StockBadge } from '@/components/ui'
import { useQuote } from '@/components/quote/QuoteProvider'
import { cn } from '@/lib/cn'
import { VARIATION_ATTRIBUTE_TYPES } from '@/lib/constants'
import type { ProductVariationData } from '@/lib/catalog-types'

const TYPE_LABELS = new Map<string, string>(VARIATION_ATTRIBUTE_TYPES.map((t) => [t.value, t.label]))

function chipLabel(v: ProductVariationData): string {
  if (v.label) return v.label
  const first = v.attributes[0]?.value
  if (first) return first
  const suffix = v.sku.split('/')[1]
  return suffix ? `Varianta ${suffix}` : v.sku
}

/** Dominant variation axis (e.g. "Dimensiuni ușă") from the RO type labels. */
function axisLabel(variations: ProductVariationData[]): string {
  const counts = new Map<string, number>()
  for (const v of variations) {
    const t = v.attributes[0]?.type
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return (top && TYPE_LABELS.get(top)) || 'Variantă'
}

/**
 * The product page's decision panel (spec §5.5): title + brand, mono SKU,
 * stock, price, variation chips, quantity, add-to-quote. Out-of-stock chips
 * stay selectable (struck through) — the inquiry model lets the operator
 * confirm availability, so adding is never blocked.
 */
export function BuyPanel({
  slug,
  title,
  brand,
  brandHref,
  unit,
  variations,
  phone,
  heading = 'h1',
  className,
}: {
  slug: string
  title: string
  brand?: string | null
  brandHref?: string | null
  unit?: string | null
  variations: ProductVariationData[]
  phone?: string | null
  heading?: 'h1' | 'h2'
  className?: string
}): React.JSX.Element {
  const quote = useQuote()
  const initial =
    variations.find((v) => v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock') ?? variations[0]
  const [selectedSku, setSelectedSku] = useState<string | null>(initial?.sku ?? null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const timer = useRef<number | null>(null)

  const selected = useMemo(
    () => variations.find((v) => v.sku === selectedSku) ?? variations[0] ?? null,
    [variations, selectedSku],
  )
  const axis = useMemo(() => axisLabel(variations), [variations])
  const Heading = heading

  const add = (): void => {
    if (!selected) return
    quote.add({
      sku: selected.sku,
      productSlug: slug,
      title,
      variationLabel: selected.label ?? undefined,
      unitPrice: selected.priceOnRequest ? null : selected.price,
      priceOnRequest: selected.priceOnRequest,
      quantity,
    })
    setAdded(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div>
        {brand &&
          (brandHref ? (
            <Link
              href={brandHref}
              className="text-[11px] uppercase tracking-widest text-accent hover:underline"
            >
              {brand}
            </Link>
          ) : (
            <span className="text-[11px] uppercase tracking-widest text-accent">{brand}</span>
          ))}
        <Heading className="mt-1 font-display text-2xl font-bold leading-tight text-fg">{title}</Heading>
      </div>

      {selected && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs text-muted">{selected.sku}</span>
          <StockBadge status={selected.stockStatus} />
        </div>
      )}

      <PriceDisplay
        amount={selected?.price ?? null}
        onRequest={selected?.priceOnRequest ?? true}
        perUnit={unit}
        size="lg"
      />

      {variations.length > 1 && (
        <div>
          <p className="text-xs text-muted">{axis}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={axis}>
            {variations.map((v) => {
              const active = v.sku === selected?.sku
              const oos = v.stockStatus === 'out_of_stock'
              const label = chipLabel(v)
              return (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedSku(v.sku)}
                  title={oos ? `${label} — stoc epuizat` : label}
                  className={cn(
                    'rounded-control border px-2.5 py-1.5 text-xs transition-colors',
                    /\d/.test(label) && 'font-mono',
                    active
                      ? 'border-accent bg-surface-2 text-fg'
                      : 'border-border text-muted hover:border-faint hover:text-fg',
                    oos && 'line-through opacity-60',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button
          fullWidth
          onClick={add}
          disabled={!selected}
          iconStart={
            added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />
          }
          className={cn(added && 'bg-stock-in text-fg hover:bg-stock-in')}
        >
          {added ? 'Adăugat în comandă' : 'Adaugă în comandă'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled
          title="Comparația produselor — în curând"
          iconStart={<ArrowLeftRight className="size-3.5" aria-hidden />}
        >
          Compară
        </Button>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'flex-1' })}
          >
            <Phone className="size-3.5" aria-hidden />
            Cere ofertă
          </a>
        )}
      </div>
    </div>
  )
}

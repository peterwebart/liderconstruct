'use client'

import { ArrowRight, Check, Package, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { PriceDisplay, Skeleton, StockBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ProductCardData } from '@/lib/catalog-types'

import { useQuickAdd } from './useQuickAdd'

/**
 * Product card (spec §3/§5.4): image, brand, title, mono SKU, price, stock,
 * quick add. Hover = 2px lift + accent left tick + image scale (motion-safe).
 * The whole card is a stretched link; actions sit above it.
 */
export function ProductCard({ product }: { product: ProductCardData }): React.JSX.Element {
  const { canQuickAdd, added, add } = useQuickAdd(product)
  const href = `/products/${product.slug}`

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface',
        'transition-all duration-150 hover:border-faint motion-safe:hover:-translate-y-0.5',
      )}
    >
      <Link href={href} className="absolute inset-0 z-[1] rounded-card" aria-label={product.title} />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-4 left-0 top-4 z-[2] w-0.5 rounded-full bg-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-blueprint">
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
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-[10px] uppercase tracking-widest text-faint">{product.brand}</span>
        )}
        <h3 className="line-clamp-2 text-sm text-fg">{product.title}</h3>
        {product.sku && <span className="font-mono text-[11px] text-faint">{product.sku}</span>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <PriceDisplay
              amount={product.priceMin}
              onRequest={product.priceOnRequest}
              perUnit={product.unit}
              size="sm"
              className="block"
            />
            <StockBadge status={product.stockStatus} className="mt-1" />
          </div>

          {canQuickAdd ? (
            <button
              type="button"
              onClick={add}
              aria-label={`Adaugă ${product.title} în comandă`}
              className={cn(
                'relative z-[2] shrink-0 rounded-control p-2 transition-colors duration-150',
                added ? 'bg-stock-in text-fg' : 'bg-accent text-accent-fg hover:bg-accent-600',
              )}
            >
              {added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            </button>
          ) : (
            <Link
              href={href}
              aria-label={`Alege varianta pentru ${product.title}`}
              title="Alege varianta"
              className="relative z-[2] shrink-0 rounded-control border border-border p-2 text-muted transition-colors duration-150 hover:border-faint hover:text-fg"
            >
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
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
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex items-end justify-between pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  )
}

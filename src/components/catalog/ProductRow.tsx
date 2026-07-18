'use client'

import { ArrowRight, Check, Package, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { PriceDisplay, Skeleton, StockBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ProductCardData } from '@/lib/catalog-types'

import { useQuickAdd } from './useQuickAdd'

/** Dense list row — the ProductList item (spec §3). */
export function ProductRow({ product }: { product: ProductCardData }): React.JSX.Element {
  const { canQuickAdd, added, add } = useQuickAdd(product)
  const href = `/products/${product.slug}`

  return (
    <div className="group relative flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
      <Link href={href} className="absolute inset-0 z-[1]" aria-label={product.title} />

      <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-blueprint">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Package className="size-5 text-border" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg">{product.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
          {product.sku && <span className="font-mono">{product.sku}</span>}
          {product.brand && <span className="uppercase tracking-wider">{product.brand}</span>}
        </p>
      </div>

      <StockBadge status={product.stockStatus} className="hidden shrink-0 sm:inline-flex" />
      <PriceDisplay
        amount={product.priceMin}
        onRequest={product.priceOnRequest}
        perUnit={product.unit}
        size="sm"
        className="shrink-0 text-right"
      />

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
          className="relative z-[2] shrink-0 rounded-control border border-border p-2 text-muted transition-colors hover:border-faint hover:text-fg"
        >
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}

export function ProductRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="size-14 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="size-8" />
    </div>
  )
}

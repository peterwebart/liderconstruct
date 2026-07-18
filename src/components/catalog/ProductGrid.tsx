import React from 'react'

import { cn } from '@/lib/cn'
import type { ProductCardData } from '@/lib/catalog-types'

import { ProductCard, ProductCardSkeleton } from './ProductCard'

/** Responsive card grid with loading + empty states (spec §3). */
export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  empty,
  className,
}: {
  products: ProductCardData[]
  loading?: boolean
  skeletonCount?: number
  empty?: React.ReactNode
  className?: string
}): React.JSX.Element {
  const grid = cn('grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4', className)
  if (loading) {
    return (
      <div className={grid} aria-busy>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (products.length === 0) return <>{empty ?? null}</>
  return (
    <div className={grid}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

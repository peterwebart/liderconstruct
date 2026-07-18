import React from 'react'

import { cn } from '@/lib/cn'
import type { ProductCardData } from '@/lib/catalog-types'

import { ProductRow, ProductRowSkeleton } from './ProductRow'

/** Dense row view — toggles with the grid on category/search pages. */
export function ProductList({
  products,
  loading = false,
  skeletonCount = 6,
  empty,
  className,
}: {
  products: ProductCardData[]
  loading?: boolean
  skeletonCount?: number
  empty?: React.ReactNode
  className?: string
}): React.JSX.Element {
  const shell = cn('divide-y divide-border overflow-hidden rounded-card border border-border bg-surface', className)
  if (loading) {
    return (
      <div className={shell} aria-busy>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductRowSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (products.length === 0) return <>{empty ?? null}</>
  return (
    <div className={shell}>
      {products.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </div>
  )
}

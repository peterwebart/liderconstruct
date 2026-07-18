import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { ProductCard } from '@/components/catalog/ProductCard'
import { cn } from '@/lib/cn'
import type { ProductCardData } from '@/lib/catalog-types'

/**
 * Horizontal cross-sell rail (accessories / alternatives / frequently bought
 * together). Native scroll with snap points; hidden entirely when empty.
 */
export function RelatedProducts({
  title,
  products,
  href,
  className,
}: {
  title: string
  products: ProductCardData[]
  href?: string
  className?: string
}): React.JSX.Element | null {
  if (products.length === 0) return null
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-medium text-fg">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs text-accent hover:underline">
            Vezi toate <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-[220px] flex-none snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

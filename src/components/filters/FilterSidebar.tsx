'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { cn } from '@/lib/cn'
import { buildFilterParams, countActiveFilters, parseFilters, type FilterState } from '@/lib/filter-params'
import type { FacetsResult } from '@/services/search/types'

import { FacetGroups } from './FacetGroups'

/**
 * Desktop facet sidebar (spec §5.4). Changes apply instantly to the URL
 * (shareable, back-button friendly). Must be rendered inside <Suspense>.
 */
export function FilterSidebar({
  data,
  className,
}: {
  data: FacetsResult
  className?: string
}): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useMemo(() => parseFilters(new URLSearchParams(searchParams)), [searchParams])
  const activeCount = countActiveFilters(state)

  const apply = (next: FilterState): void => {
    const params = buildFilterParams(next, new URLSearchParams(searchParams))
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
  }

  return (
    <aside className={cn('w-full', className)} aria-label="Filtre">
      <div className="flex items-baseline justify-between pb-1">
        <h3 className="text-xs font-medium text-fg">
          Filtre
          {activeCount > 0 && <span className="ml-1.5 font-mono text-[11px] text-accent">{activeCount}</span>}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            className="text-xs text-muted transition-colors hover:text-fg"
            onClick={() => apply({ ...state, brands: [], attrs: {}, priceMin: null, priceMax: null, inStockOnly: false })}
          >
            Șterge tot
          </button>
        )}
      </div>
      <FacetGroups data={data} value={state} onChange={apply} />
    </aside>
  )
}

'use client'

import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { buildFilterParams, countActiveFilters, parseFilters, type FilterState } from '@/lib/filter-params'
import type { FacetsResult } from '@/services/search/types'

/** Removable chips mirroring the active filters, above the results grid. */
export function ActiveFilterChips({ data }: { data: FacetsResult }): React.JSX.Element | null {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useMemo(() => parseFilters(new URLSearchParams(searchParams)), [searchParams])

  if (countActiveFilters(state) === 0) return null

  const apply = (next: FilterState): void => {
    const params = buildFilterParams(next, new URLSearchParams(searchParams))
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
  }

  const labelFor = (facetKey: string, value: string): string => {
    const facet = data.facets.find((f) => f.key === facetKey)
    return facet?.values.find((v) => v.value === value)?.label ?? value
  }

  const chip = (key: string, label: string, mono: boolean, onRemove: () => void): React.JSX.Element => (
    <button
      key={key}
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-control border border-accent bg-surface-2 px-2 py-1 text-xs text-fg transition-colors hover:bg-surface"
      aria-label={`Elimină filtrul ${label}`}
    >
      <span className={mono ? 'font-mono' : undefined}>{label}</span>
      <X className="size-3 text-accent" aria-hidden />
    </button>
  )

  const chips: React.JSX.Element[] = []
  for (const b of state.brands) {
    chips.push(chip(`b-${b}`, labelFor('_brand', b), false, () => apply({ ...state, brands: state.brands.filter((x) => x !== b) })))
  }
  for (const [key, values] of Object.entries(state.attrs)) {
    for (const v of values) {
      chips.push(
        chip(`a-${key}-${v}`, labelFor(key, v), true, () => {
          const attrs = { ...state.attrs, [key]: values.filter((x) => x !== v) }
          if (attrs[key].length === 0) delete attrs[key]
          apply({ ...state, attrs })
        }),
      )
    }
  }
  if (state.priceMin != null || state.priceMax != null) {
    const label = `${state.priceMin ?? '…'} – ${state.priceMax ?? '…'} MDL`
    chips.push(chip('price', label, true, () => apply({ ...state, priceMin: null, priceMax: null })))
  }
  if (state.inStockOnly) {
    chips.push(chip('stock', 'Doar în stoc', false, () => apply({ ...state, inStockOnly: false })))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtre active">
      {chips}
      <button
        type="button"
        className="px-1.5 text-xs text-muted transition-colors hover:text-fg"
        onClick={() => apply({ ...state, brands: [], attrs: {}, priceMin: null, priceMax: null, inStockOnly: false })}
      >
        Șterge filtrele
      </button>
    </div>
  )
}

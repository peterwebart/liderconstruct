'use client'

import { Check } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import type { FilterState } from '@/lib/filter-params'
import type { Facet, FacetsResult } from '@/services/search/types'

/**
 * Controlled facet renderer shared by FilterSidebar (instant apply) and
 * MobileFilters (staged apply). Facets arrive from the registry-driven
 * aggregation; nothing here knows attribute names (ADR-0004).
 */

const VISIBLE_VALUES = 6

function isChipFacet(f: Facet): boolean {
  return f.values.length <= 12 && f.values.every((v) => (v.label ?? v.value).length <= 8)
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-control px-1 py-1 text-left transition-colors hover:bg-surface-2"
    >
      <span
        aria-hidden
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
          checked ? 'border-accent bg-accent' : 'border-border',
        )}
      >
        {checked && <Check className="size-3 text-accent-fg" />}
      </span>
      <span className={cn('flex-1 truncate text-sm', checked ? 'text-fg' : 'text-muted')}>{label}</span>
      <span className="font-mono text-[11px] text-faint">{formatCount(count)}</span>
    </button>
  )
}

function FacetSection({
  facet,
  selected,
  onChange,
}: {
  facet: Facet
  selected: string[]
  onChange: (values: string[]) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const chips = isChipFacet(facet)
  const values = expanded ? facet.values : facet.values.slice(0, chips ? facet.values.length : VISIBLE_VALUES)

  return (
    <section className="border-t border-border pt-3">
      <h4 className="flex items-baseline justify-between text-xs text-muted">
        {facet.label}
        {selected.length > 0 && <span className="font-mono text-[11px] text-accent">{selected.length}</span>}
      </h4>
      {chips ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => {
            const active = selected.includes(v.value)
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(toggle(selected, v.value))}
                className={cn(
                  'rounded-control border px-2 py-1 font-mono text-xs transition-colors',
                  active
                    ? 'border-accent bg-accent font-medium text-accent-fg'
                    : 'border-border text-muted hover:border-faint hover:text-fg',
                )}
              >
                {v.label ?? v.value}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-1.5">
          {values.map((v) => (
            <CheckRow
              key={v.value}
              label={v.label ?? v.value}
              count={v.count}
              checked={selected.includes(v.value)}
              onToggle={() => onChange(toggle(selected, v.value))}
            />
          ))}
          {facet.values.length > VISIBLE_VALUES && (
            <button
              type="button"
              className="mt-1 px-1 text-xs text-accent hover:underline"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Arată mai puține' : `Arată toate (${facet.values.length})`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function PriceSection({
  range,
  min,
  max,
  onChange,
}: {
  range: FacetsResult['priceRange']
  min: number | null
  max: number | null
  onChange: (min: number | null, max: number | null) => void
}): React.JSX.Element {
  const [localMin, setLocalMin] = useState(min?.toString() ?? '')
  const [localMax, setLocalMax] = useState(max?.toString() ?? '')
  useEffect(() => setLocalMin(min?.toString() ?? ''), [min])
  useEffect(() => setLocalMax(max?.toString() ?? ''), [max])

  const commit = (): void => {
    const parse = (s: string): number | null => {
      const n = Number(s)
      return s !== '' && Number.isFinite(n) && n >= 0 ? n : null
    }
    onChange(parse(localMin), parse(localMax))
  }
  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') commit()
  }
  const bounds =
    range.min != null && range.max != null ? `${Math.floor(range.min)} – ${Math.ceil(range.max)} MDL` : null

  return (
    <section className="border-t border-border pt-3">
      <h4 className="flex items-baseline justify-between text-xs text-muted">
        Preț
        {bounds && <span className="font-mono text-[11px] text-faint">{bounds}</span>}
      </h4>
      <div className="mt-2 flex items-center gap-2">
        <input
          inputMode="numeric"
          placeholder={range.min != null ? String(Math.floor(range.min)) : 'min'}
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
          aria-label="Preț minim (MDL)"
          className="h-8 w-full rounded-control border border-border bg-surface-2 px-2 font-mono text-xs text-fg outline-none placeholder:text-faint focus:border-accent"
        />
        <span className="text-faint">–</span>
        <input
          inputMode="numeric"
          placeholder={range.max != null ? String(Math.ceil(range.max)) : 'max'}
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
          aria-label="Preț maxim (MDL)"
          className="h-8 w-full rounded-control border border-border bg-surface-2 px-2 font-mono text-xs text-fg outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
    </section>
  )
}

export function FacetGroups({
  data,
  value,
  onChange,
}: {
  data: FacetsResult
  value: FilterState
  onChange: (next: FilterState) => void
}): React.JSX.Element {
  const brandFacet = data.facets.find((f) => f.key === '_brand')
  const attrFacets = data.facets.filter((f) => f.key !== '_brand')

  return (
    <div className="space-y-3">
      {brandFacet && (
        <FacetSection
          facet={brandFacet}
          selected={value.brands}
          onChange={(brands) => onChange({ ...value, brands })}
        />
      )}
      {attrFacets.map((f) => (
        <FacetSection
          key={f.key}
          facet={f}
          selected={value.attrs[f.key] ?? []}
          onChange={(vals) => {
            const attrs = { ...value.attrs }
            if (vals.length) attrs[f.key] = vals
            else delete attrs[f.key]
            onChange({ ...value, attrs })
          }}
        />
      ))}
      <PriceSection
        range={data.priceRange}
        min={value.priceMin}
        max={value.priceMax}
        onChange={(priceMin, priceMax) => onChange({ ...value, priceMin, priceMax })}
      />
      <section className="border-t border-border pt-3">
        <CheckRow
          label="Doar în stoc"
          count={data.stockCounts.inStock}
          checked={value.inStockOnly}
          onToggle={() => onChange({ ...value, inStockOnly: !value.inStockOnly })}
        />
      </section>
    </div>
  )
}

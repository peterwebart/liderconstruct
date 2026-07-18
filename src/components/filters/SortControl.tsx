'use client'

import { ArrowUpDown, Check, ChevronDown, LayoutGrid, List } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { buildFilterParams, parseFilters, type SortKey, type ViewKey } from '@/lib/filter-params'

const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevanță',
  price_asc: 'Preț crescător',
  price_desc: 'Preț descrescător',
  newest: 'Cele mai noi',
}

/** Sort dropdown + grid/list view toggle; both persist in the URL. */
export function SortControl({ className }: { className?: string }): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useMemo(() => parseFilters(new URLSearchParams(searchParams)), [searchParams])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const apply = (patch: { sort?: SortKey; view?: ViewKey }): void => {
    const params = buildFilterParams({ ...state, ...patch }, new URLSearchParams(searchParams))
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 items-center gap-1.5 rounded-control border border-border px-2.5 text-xs text-muted transition-colors hover:border-faint hover:text-fg"
        >
          <ArrowUpDown className="size-3.5" aria-hidden />
          {SORT_LABELS[state.sort]}
          <ChevronDown className={cn('size-3 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
        </button>
        {open && (
          <div
            role="menu"
            className="menu-pane absolute right-0 top-full z-40 mt-1.5 w-48 rounded-card border border-border bg-surface p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={state.sort === key}
                onClick={() => {
                  apply({ sort: key })
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-sm text-fg hover:bg-surface-2"
              >
                {SORT_LABELS[key]}
                {state.sort === key && <Check className="size-3.5 text-accent" aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex overflow-hidden rounded-control border border-border" role="group" aria-label="Mod de afișare">
        <button
          type="button"
          aria-label="Afișare grilă"
          aria-pressed={state.view === 'grid'}
          onClick={() => apply({ view: 'grid' })}
          className={cn('flex size-8 items-center justify-center transition-colors', state.view === 'grid' ? 'text-accent' : 'text-faint hover:text-fg')}
        >
          <LayoutGrid className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Afișare listă"
          aria-pressed={state.view === 'list'}
          onClick={() => apply({ view: 'list' })}
          className={cn('flex size-8 items-center justify-center border-l border-border transition-colors', state.view === 'list' ? 'text-accent' : 'text-faint hover:text-fg')}
        >
          <List className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

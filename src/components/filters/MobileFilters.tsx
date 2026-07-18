'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { buildFilterParams, countActiveFilters, emptyFilters, parseFilters, type FilterState } from '@/lib/filter-params'
import type { FacetsResult } from '@/services/search/types'

import { FacetGroups } from './FacetGroups'

/**
 * Mobile filters as a bottom sheet (spec §5.6): selections stage locally and
 * apply together via the sticky button; the count keeps users out of dead ends
 * (live result count wires in at page assembly via `resultCount`).
 */
export function MobileFilters({
  data,
  resultCount,
  triggerClassName,
}: {
  data: FacetsResult
  resultCount?: number | null
  triggerClassName?: string
}): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlState = useMemo(() => parseFilters(new URLSearchParams(searchParams)), [searchParams])

  const [open, setOpen] = useState(false)
  const [staged, setStaged] = useState<FilterState>(urlState)

  useEffect(() => {
    if (open) setStaged(urlState)
  }, [open, urlState])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const urlCount = countActiveFilters(urlState)
  const stagedCount = countActiveFilters(staged)

  const apply = (): void => {
    const params = buildFilterParams(staged, new URLSearchParams(searchParams))
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        iconStart={<SlidersHorizontal className="size-3.5" aria-hidden />}
        onClick={() => setOpen(true)}
        className={cn('md:hidden', triggerClassName)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Filtre
        {urlCount > 0 && (
          <span className="rounded-control bg-accent px-1.5 font-mono text-[11px] text-accent-fg">{urlCount}</span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Filtre">
          <button
            type="button"
            aria-label="Închide filtrele"
            className="absolute inset-0 bg-bg/70"
            onClick={() => setOpen(false)}
          />
          <div className="menu-pane absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-sheet border-t border-border bg-surface">
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" aria-hidden />
            <div className="flex items-center justify-between px-4 pb-2 pt-2">
              <span className="text-sm font-medium text-fg">Filtre</span>
              <div className="flex items-center gap-3">
                {stagedCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted transition-colors hover:text-fg"
                    onClick={() => setStaged({ ...emptyFilters(), sort: staged.sort, view: staged.view })}
                  >
                    Șterge tot
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Închide"
                  onClick={() => setOpen(false)}
                  className="flex size-8 items-center justify-center rounded-control text-muted transition-colors hover:text-fg"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <FacetGroups data={data} value={staged} onChange={setStaged} />
            </div>
            <div className="border-t border-border bg-surface p-3">
              <Button fullWidth onClick={apply}>
                Aplică{stagedCount > 0 ? ` (${stagedCount})` : ''}
                {resultCount != null ? ` · ${resultCount} produse` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

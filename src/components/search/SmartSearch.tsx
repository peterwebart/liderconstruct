'use client'

import { ArrowRight, Building2, Clock, LayoutGrid, Loader2, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PriceDisplay } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { SuggestGroups } from '@/services/search/types'

const RECENT_KEY = 'lc:recent-searches'
const MAX_RECENT = 6

interface PopularTerm {
  label: string
  query: string
}

type Row =
  | { kind: 'product'; href: string; title: string; sku: string | null; priceMin: number | null; priceOnRequest: boolean }
  | { kind: 'brand'; href: string; name: string; count: number }
  | { kind: 'category'; href: string; path: string; count: number }
  | { kind: 'all'; href: string; term: string }

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/**
 * SmartSearch — the site's centerpiece (spec §5.3). Grouped instant
 * suggestions (SKU/name → brands → categories), full keyboard navigation,
 * recent + popular searches. Engine-agnostic: talks only to /api/search/suggest.
 */
export function SmartSearch({
  locale = 'ro',
  popular = [],
  placeholder = 'Caută produs, SKU, brand…',
  size = 'md',
  autoFocus = false,
  className,
}: {
  locale?: 'ro' | 'ru'
  popular?: PopularTerm[]
  placeholder?: string
  size?: 'md' | 'lg'
  autoFocus?: boolean
  className?: string
}): React.JSX.Element {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = React.useId()

  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<SuggestGroups | null>(null)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setRecent(readRecent())
  }, [])

  const saveRecent = useCallback((value: string) => {
    const v = value.trim()
    if (!v) return
    setRecent((prev) => {
      const next = [v, ...prev.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX_RECENT)
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — recents stay in memory */
      }
      return next
    })
  }, [])

  // Debounced suggestions with abort on new keystrokes.
  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) {
      setGroups(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}&locale=${locale}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error(`suggest ${res.status}`)
        const data = (await res.json()) as SuggestGroups
        setGroups(data)
        setActive(0)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setGroups(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 200)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [term, locale])

  // Close on outside interaction.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const rows = useMemo<Row[]>(() => {
    const q = term.trim()
    if (q.length < 2) return []
    const out: Row[] = []
    for (const p of groups?.products ?? []) {
      out.push({
        kind: 'product',
        href: `/products/${p.slug}`,
        title: p.title,
        sku: p.sku ?? null,
        priceMin: p.priceMin,
        priceOnRequest: p.priceOnRequest,
      })
    }
    for (const b of groups?.brands ?? []) {
      out.push({ kind: 'brand', href: `/brand/${b.slug}`, name: b.name, count: b.count })
    }
    for (const c of groups?.categories ?? []) {
      out.push({ kind: 'category', href: c.href, path: c.path, count: c.count })
    }
    out.push({ kind: 'all', href: `/search?q=${encodeURIComponent(q)}`, term: q })
    return out
  }, [groups, term])

  const go = useCallback(
    (href: string) => {
      saveRecent(term)
      setOpen(false)
      router.push(href)
    },
    [router, saveRecent, term],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!open) setOpen(true)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (rows.length === 0) return
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + delta + rows.length) % rows.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[active] ?? rows[rows.length - 1]
      if (row) go(row.href)
      else if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`)
    }
  }

  const idle = open && term.trim().length < 2
  const showList = open && rows.length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          aria-label={placeholder}
          autoFocus={autoFocus}
          value={term}
          placeholder={placeholder}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full rounded-control border border-border bg-surface-2 pl-10 pr-10 text-fg outline-none transition-colors duration-150',
            'placeholder:text-faint focus:border-accent',
            size === 'lg' ? 'h-12 text-base' : 'h-10 text-sm',
          )}
        />
        <Search
          className={cn('absolute left-3 top-1/2 size-4 -translate-y-1/2', open ? 'text-accent' : 'text-faint')}
          aria-hidden
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="size-4 text-faint motion-safe:animate-spin" aria-hidden />
          ) : term ? (
            <button
              type="button"
              aria-label="Șterge căutarea"
              className="text-faint transition-colors hover:text-fg"
              onClick={() => {
                setTerm('')
                inputRef.current?.focus()
              }}
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </span>
      </div>

      {(showList || idle) && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {idle ? (
            <div className="p-3">
              {recent.length > 0 && (
                <>
                  <p className="px-1 pb-1 text-[11px] tracking-widest text-faint">RECENTE</p>
                  <ul>
                    {recent.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 rounded-control px-2 py-1.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                          onClick={() => go(`/search?q=${encodeURIComponent(r)}`)}
                        >
                          <Clock className="size-3.5 text-faint" aria-hidden />
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {popular.length > 0 && (
                <>
                  <p className="px-1 pb-1.5 pt-2 text-[11px] tracking-widest text-faint">CĂUTĂRI POPULARE</p>
                  <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                    {popular.map((p) => (
                      <button
                        key={p.query}
                        type="button"
                        className="rounded-control border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
                        onClick={() => go(`/search?q=${encodeURIComponent(p.query)}`)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {recent.length === 0 && popular.length === 0 && (
                <p className="px-2 py-3 text-sm text-faint">Tastează cel puțin 2 caractere…</p>
              )}
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Sugestii de căutare" className="max-h-[420px] overflow-auto">
              {rows.map((row, i) => {
                const isActive = i === active
                const base = cn(
                  'flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left transition-colors',
                  isActive ? 'border-accent bg-surface-2' : 'border-transparent hover:bg-surface-2',
                )
                const groupStart =
                  (row.kind === 'product' && i === 0) ||
                  (row.kind === 'brand' && rows[i - 1]?.kind !== 'brand') ||
                  (row.kind === 'category' && rows[i - 1]?.kind !== 'category')
                const label =
                  row.kind === 'product' ? 'PRODUSE' : row.kind === 'brand' ? 'BRANDURI' : 'CATEGORII'
                return (
                  <li key={`${row.kind}-${row.href}`} role="presentation">
                    {groupStart && (
                      <p className="border-t border-border px-3 pb-0.5 pt-2 text-[11px] tracking-widest text-faint first:border-t-0">
                        {label}
                      </p>
                    )}
                    <button
                      type="button"
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={isActive}
                      className={cn(base, row.kind === 'all' && 'border-t border-t-border bg-bg/50 py-2.5')}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(row.href)}
                    >
                      {row.kind === 'product' && (
                        <>
                          <span className="size-9 shrink-0 rounded-control bg-blueprint" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-fg">{row.title}</span>
                            {row.sku && (
                              <span className="font-mono text-xs text-faint">{row.sku}</span>
                            )}
                          </span>
                          <PriceDisplay amount={row.priceMin} onRequest={row.priceOnRequest} size="sm" />
                        </>
                      )}
                      {row.kind === 'brand' && (
                        <>
                          <Building2 className="size-4 shrink-0 text-muted" aria-hidden />
                          <span className="flex-1 text-sm text-fg">{row.name}</span>
                          <span className="font-mono text-xs text-faint">{row.count}</span>
                        </>
                      )}
                      {row.kind === 'category' && (
                        <>
                          <LayoutGrid className="size-4 shrink-0 text-muted" aria-hidden />
                          <span className="flex-1 truncate text-sm text-muted">
                            {row.path.split(' › ').map((seg, j, arr) => (
                              <span key={j} className={j === arr.length - 1 ? 'text-fg' : undefined}>
                                {seg}
                                {j < arr.length - 1 ? ' › ' : ''}
                              </span>
                            ))}
                          </span>
                          <span className="font-mono text-xs text-faint">{row.count}</span>
                        </>
                      )}
                      {row.kind === 'all' && (
                        <>
                          <kbd className="rounded-control border border-border px-1.5 font-mono text-[11px] text-faint">
                            ↵
                          </kbd>
                          <span className="flex-1 text-sm text-muted">
                            Caută „{row.term}” în tot catalogul
                          </span>
                          <ArrowRight className="size-4 text-accent" aria-hidden />
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

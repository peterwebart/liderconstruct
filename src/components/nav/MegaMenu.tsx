'use client'

import { ArrowRight, ChevronDown, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import type { NavBrand, NavSection, PopularTerm } from '@/lib/navigation'

/**
 * Two-pane desktop mega menu (spec §5.2), built entirely from the internal
 * taxonomy. Keyboard: ↓/↑ move sections, → enters categories, ← returns,
 * Enter opens, Esc closes and restores focus to the trigger.
 */
export function MegaMenu({
  sections,
  featuredBrands = [],
  popular = [],
  label = 'Produse',
}: {
  sections: NavSection[]
  featuredBrands?: NavBrand[]
  popular?: PopularTerm[]
  label?: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const active = sections[activeIdx]

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close(true)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const focusSection = (idx: number): void => {
    setActiveIdx(idx)
    sectionRefs.current[idx]?.focus()
  }
  const categoryLinks = (): HTMLAnchorElement[] =>
    Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-cat]') ?? [])

  const onTriggerKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      window.requestAnimationFrame(() => focusSection(0))
    }
  }

  const onSectionKeyDown = (e: React.KeyboardEvent, idx: number): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusSection((idx + 1) % sections.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusSection((idx - 1 + sections.length) % sections.length)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      categoryLinks()[0]?.focus()
    }
  }

  const onCategoryKeyDown = (e: React.KeyboardEvent, catIdx: number): void => {
    const links = categoryLinks()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      links[(catIdx + 1) % links.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      links[(catIdx - 1 + links.length) % links.length]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      sectionRefs.current[activeIdx]?.focus()
    }
  }

  const featuredCategory = active?.children.find((c) => c.featured) ?? active?.children[0]
  const topBrand = featuredBrands[activeIdx % Math.max(featuredBrands.length, 1)]

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'flex h-9 items-center gap-1 rounded-control px-2.5 text-sm transition-colors',
          open ? 'text-accent' : 'text-muted hover:text-fg',
        )}
      >
        {label}
        <ChevronDown className={cn('size-3.5 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          className="menu-pane absolute left-0 top-full z-50 mt-2 w-[720px] max-w-[86vw] overflow-hidden rounded-card border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {sections.length === 0 ? (
            <p className="p-6 text-sm text-faint">Taxonomia se încarcă după primul import.</p>
          ) : (
            <div className="grid grid-cols-[200px_1fr]">
              <ul className="max-h-[420px] overflow-y-auto border-r border-border py-2" role="presentation">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <button
                      ref={(el) => {
                        sectionRefs.current[i] = el
                      }}
                      type="button"
                      role="menuitem"
                      onMouseEnter={() => setActiveIdx(i)}
                      onFocus={() => setActiveIdx(i)}
                      onKeyDown={(e) => onSectionKeyDown(e, i)}
                      onClick={() => close()}
                      className={cn(
                        'flex w-full items-center gap-2 border-l-2 px-3.5 py-2 text-left text-sm transition-colors',
                        i === activeIdx
                          ? 'border-accent bg-surface-2 text-fg'
                          : 'border-transparent text-muted hover:text-fg',
                      )}
                    >
                      <LayoutGrid className={cn('size-4 shrink-0', i === activeIdx ? 'text-accent' : 'text-faint')} aria-hidden />
                      <span className="flex-1 truncate">{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {active && (
                <div key={active.id} className="menu-pane p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-sm font-medium text-fg">{active.title}</span>
                    <Link
                      href={active.href}
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                      onClick={() => close()}
                    >
                      Vezi tot <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </div>

                  <ul className="mt-2.5 grid grid-cols-2 gap-x-5" role="presentation">
                    {active.children.map((c, ci) => (
                      <li key={c.id}>
                        <Link
                          href={c.href}
                          data-cat
                          role="menuitem"
                          onKeyDown={(e) => onCategoryKeyDown(e, ci)}
                          onClick={() => close()}
                          className="flex items-baseline justify-between gap-2 rounded-control px-1.5 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
                        >
                          <span className="truncate">{c.title}</span>
                          {c.count > 0 && (
                            <span className="font-mono text-[11px] text-faint">{formatCount(c.count)}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                    {active.children.length === 0 && (
                      <li className="col-span-2 py-2 text-sm text-faint">Categoriile apar după import.</li>
                    )}
                  </ul>

                  {(featuredCategory || topBrand) && (
                    <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-border pt-3">
                      {featuredCategory && (
                        <Link
                          href={featuredCategory.href}
                          onClick={() => close()}
                          className="flex items-center gap-2.5 rounded-card border border-border bg-surface-2 p-2.5 transition-colors hover:border-faint"
                        >
                          <span className="size-10 shrink-0 rounded-control bg-blueprint" aria-hidden />
                          <span>
                            <span className="block text-[10px] tracking-widest text-faint">CATEGORIE RECOMANDATĂ</span>
                            <span className="block text-xs text-fg">{featuredCategory.title}</span>
                          </span>
                        </Link>
                      )}
                      {topBrand && (
                        <Link
                          href={topBrand.href}
                          onClick={() => close()}
                          className="flex items-center gap-2.5 rounded-card border border-border bg-surface-2 p-2.5 transition-colors hover:border-faint"
                        >
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-control bg-blueprint text-[10px] font-medium text-muted" aria-hidden>
                            {topBrand.name.toUpperCase().slice(0, 8)}
                          </span>
                          <span>
                            <span className="block text-[10px] tracking-widest text-faint">BRAND DE TOP</span>
                            <span className="block text-xs text-fg">{topBrand.name}</span>
                          </span>
                        </Link>
                      )}
                    </div>
                  )}

                  {popular.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-faint">Populare:</span>
                      {popular.slice(0, 4).map((p) => (
                        <Link
                          key={p.query}
                          href={`/search?q=${encodeURIComponent(p.query)}`}
                          onClick={() => close()}
                          className="rounded-control border border-border px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-accent hover:text-fg"
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

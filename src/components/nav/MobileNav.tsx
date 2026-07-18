'use client'

import { ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import type { NavSection } from '@/lib/navigation'

/**
 * Mobile navigation — full-screen stacked accordion over the taxonomy
 * (spec §5.6). Body scroll locks while open; Esc closes.
 */
export function MobileNav({
  sections,
  children,
}: {
  sections: NavSection[]
  /** Optional slot rendered under the panel header (e.g. SmartSearch). */
  children?: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

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

  return (
    <>
      <button
        type="button"
        aria-label="Deschide meniul"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:text-fg md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg md:hidden" role="dialog" aria-modal aria-label="Meniu">
          <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
            <span className="font-display text-sm font-bold tracking-wide text-fg">
              LIDER<span className="text-accent">CONSTRUCT</span>
            </span>
            <button
              type="button"
              aria-label="Închide meniul"
              onClick={() => setOpen(false)}
              className="flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:text-fg"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {children && <div className="border-b border-border bg-surface p-3">{children}</div>}

          <nav className="flex-1 overflow-y-auto pb-8">
            {sections.length === 0 && (
              <p className="p-4 text-sm text-faint">Taxonomia se încarcă după primul import.</p>
            )}
            <ul>
              {sections.map((s) => {
                const isOpen = expanded === s.id
                return (
                  <li key={s.id} className="border-b border-border">
                    <div className="flex items-stretch">
                      <Link
                        href={s.href}
                        onClick={() => setOpen(false)}
                        className="flex-1 px-4 py-3.5 text-sm text-fg"
                      >
                        {s.title}
                      </Link>
                      {s.children.length > 0 && (
                        <button
                          type="button"
                          aria-label={isOpen ? `Restrânge ${s.title}` : `Extinde ${s.title}`}
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : s.id)}
                          className="flex w-12 items-center justify-center text-faint"
                        >
                          <ChevronDown
                            className={cn('size-4 transition-transform duration-150', isOpen && 'rotate-180 text-accent')}
                            aria-hidden
                          />
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <ul className="menu-pane border-t border-border bg-surface">
                        {s.children.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={c.href}
                              onClick={() => setOpen(false)}
                              className="flex items-baseline justify-between gap-2 py-2.5 pl-7 pr-4 text-sm text-muted transition-colors hover:text-fg"
                            >
                              <span>{c.title}</span>
                              {c.count > 0 && (
                                <span className="font-mono text-[11px] text-faint">{formatCount(c.count)}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={s.href}
                            onClick={() => setOpen(false)}
                            className="block py-2.5 pl-7 pr-4 text-sm text-accent"
                          >
                            Vezi tot din {s.title} →
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}

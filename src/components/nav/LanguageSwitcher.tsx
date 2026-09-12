'use client'

import { Check, ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { LOCALES, LOCALE_LABELS, localePath, stripLocale, type Locale } from '@/lib/i18n'

/**
 * RO/RU switcher (ADR-0009). Switches the locale segment while preserving the
 * current path and query, so a reader on /ro/brand/knauf lands on
 * /ru/brand/knauf. Both locales are live.
 */
export function LanguageSwitcher({
  locale = 'ro',
  className,
}: {
  locale?: Locale
  className?: string
}): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
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

  const switchTo = (target: Locale): void => {
    setOpen(false)
    if (target === locale) return
    const { rest } = stripLocale(pathname || '/')
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.push(`${localePath(target, rest)}${search}`)
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1 rounded-control border border-border px-2.5 text-xs text-muted transition-colors hover:border-faint hover:text-fg"
      >
        {locale.toUpperCase()}
        <ChevronDown className={cn('size-3 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="menu-pane absolute right-0 top-full z-50 mt-1.5 w-44 rounded-card border border-border bg-surface p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l}
              onClick={() => switchTo(l)}
              className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
            >
              {LOCALE_LABELS[l]}
              {locale === l && <Check className="size-3.5 text-accent" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

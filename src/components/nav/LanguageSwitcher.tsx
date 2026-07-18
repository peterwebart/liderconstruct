'use client'

import { Check, ChevronDown } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

/**
 * RO/RU switcher. RU routing lands with the i18n increment — until then the
 * RU entry is visible but disabled (honest state, no dead navigation).
 */
export function LanguageSwitcher({
  locale = 'ro',
  className,
}: {
  locale?: 'ro' | 'ru'
  className?: string
}): React.JSX.Element {
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
          <button
            type="button"
            role="menuitemradio"
            aria-checked={locale === 'ro'}
            className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-sm text-fg hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            Română
            {locale === 'ro' && <Check className="size-3.5 text-accent" aria-hidden />}
          </button>
          <div
            role="menuitemradio"
            aria-checked={false}
            aria-disabled
            className="flex w-full cursor-not-allowed items-center justify-between rounded-control px-2.5 py-1.5 text-sm text-faint"
            title="Versiunea rusă — disponibilă în curând"
          >
            Русский
            <span className="text-[10px]">în curând</span>
          </div>
        </div>
      )}
    </div>
  )
}

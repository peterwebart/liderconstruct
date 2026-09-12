'use client'

import { Minus, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'

/**
 * Quantity control with a DIRECTLY EDITABLE value — a contractor ordering
 * 1,000 screws types "1000" instead of tapping "+" a thousand times. The − / +
 * buttons remain for small adjustments.
 *
 * While typing, the raw text is kept local so intermediate states ("", "10")
 * don't fight the caret; the value is committed (clamped, and snapped to
 * `step` when one is supplied) on blur or Enter. Escape reverts.
 *
 * `step` defaults to 1: the BusinessRules global currently defines no
 * packaging/multiple rules, so none are invented here — pass a real step when
 * the data supplies one.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  size = 'md',
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Order multiple (e.g. 10 → 10, 20, 30). Defaults to 1 (no constraint). */
  step?: number
  size?: 'sm' | 'md'
  className?: string
}): React.JSX.Element {
  const [draft, setDraft] = useState(String(value))

  // Keep the field in sync when the value changes elsewhere (e.g. variation swap).
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const normalize = (n: number): number => {
    const bounded = Math.min(max, Math.max(min, n))
    if (step <= 1) return Math.round(bounded)
    // Snap to the nearest valid multiple of `step` counted from `min`.
    const snapped = min + Math.round((bounded - min) / step) * step
    return Math.min(max, Math.max(min, snapped))
  }

  const commit = (): void => {
    const parsed = Number.parseInt(draft.replace(/[^\d]/g, ''), 10)
    const next = Number.isFinite(parsed) ? normalize(parsed) : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  const h = size === 'sm' ? 'h-8' : 'h-10'
  const w = size === 'sm' ? 'w-12' : 'w-16'

  return (
    <div
      className={cn('inline-flex items-stretch rounded-control border border-border bg-surface', h, className)}
      role="group"
      aria-label="Cantitate"
    >
      <button
        type="button"
        className="px-2.5 text-muted transition-colors hover:text-fg disabled:opacity-40"
        onClick={() => onChange(normalize(value - step))}
        disabled={value <= min}
        aria-label="Scade cantitatea"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setDraft(String(value))
            e.currentTarget.blur()
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Cantitate"
        className={cn(
          'bg-transparent text-center font-mono text-sm text-fg outline-none',
          'focus:bg-surface-2 [appearance:textfield]',
          w,
        )}
      />
      <button
        type="button"
        className="px-2.5 text-muted transition-colors hover:text-fg disabled:opacity-40"
        onClick={() => onChange(normalize(value + step))}
        disabled={value >= max}
        aria-label="Crește cantitatea"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

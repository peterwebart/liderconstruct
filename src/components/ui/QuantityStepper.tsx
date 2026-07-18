'use client'

import { Minus, Plus } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/cn'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  size = 'md',
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  className?: string
}): React.JSX.Element {
  const clamp = (n: number): number => Math.min(max, Math.max(min, n))
  const h = size === 'sm' ? 'h-8' : 'h-10'
  return (
    <div
      className={cn('inline-flex items-stretch rounded-control border border-border bg-surface', h, className)}
      role="group"
      aria-label="Cantitate"
    >
      <button
        type="button"
        className="px-2.5 text-muted transition-colors hover:text-fg disabled:opacity-40"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Scade cantitatea"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="flex min-w-9 items-center justify-center font-mono text-sm text-fg" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="px-2.5 text-muted transition-colors hover:text-fg disabled:opacity-40"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Crește cantitatea"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

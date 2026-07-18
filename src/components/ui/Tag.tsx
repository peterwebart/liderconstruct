import React from 'react'

import { cn } from '@/lib/cn'

/** Neutral chip; `spec` renders measured values in mono (SKU, 100mm, 600×2000). */
export function Tag({
  children,
  spec = false,
  active = false,
  className,
}: {
  children: React.ReactNode
  spec?: boolean
  active?: boolean
  className?: string
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-xs',
        spec && 'font-mono',
        active
          ? 'border-accent bg-surface-2 text-fg'
          : 'border-border text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

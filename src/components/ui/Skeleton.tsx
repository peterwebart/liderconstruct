import React from 'react'

import { cn } from '@/lib/cn'

/** Loading placeholder; pulse only when motion is allowed. */
export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      className={cn('rounded-control bg-surface-2 motion-safe:animate-pulse', className)}
      aria-hidden
    />
  )
}

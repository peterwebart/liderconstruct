import React from 'react'

import { cn } from '@/lib/cn'

/** Zero results / empty cart — explains and offers a way forward (spec §4.6). */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 text-center', className)}>
      {icon && <div className="text-faint" aria-hidden>{icon}</div>}
      <p className="font-medium text-fg">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

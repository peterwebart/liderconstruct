import React from 'react'

import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

/**
 * Price is data → mono. Real amounts earn the accent; "Preț la cerere" stays
 * muted (an on-request state is not a price). Never renders 0,00 lei.
 */
export function PriceDisplay({
  amount,
  onRequest = false,
  perUnit,
  size = 'md',
  className,
}: {
  amount?: number | null
  onRequest?: boolean
  perUnit?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}): React.JSX.Element {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' } as const
  const isOnRequest = onRequest || amount == null || amount <= 0

  if (isOnRequest) {
    return (
      <span className={cn('font-mono text-muted', sizes[size], className)}>Preț la cerere</span>
    )
  }
  return (
    <span className={cn('font-mono text-accent', sizes[size], className)}>
      {formatMoney(amount as number)}
      {perUnit && <span className="ml-1 text-xs text-faint">/ {perUnit}</span>}
    </span>
  )
}

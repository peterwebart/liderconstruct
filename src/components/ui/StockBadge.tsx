import React from 'react'

import { cn } from '@/lib/cn'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

const config: Record<StockStatus, { label: string; dot: string; text: string }> = {
  in_stock: { label: 'În stoc', dot: 'bg-stock-in', text: 'text-stock-in' },
  low_stock: { label: 'Stoc redus', dot: 'bg-stock-low', text: 'text-stock-low' },
  out_of_stock: { label: 'Stoc epuizat', dot: 'bg-stock-out', text: 'text-stock-out' },
}

export function StockBadge({
  status,
  className,
}: {
  status: StockStatus
  className?: string
}): React.JSX.Element {
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', c.text, className)}>
      <span className={cn('size-1.5 rounded-full', c.dot)} aria-hidden />
      {c.label}
    </span>
  )
}

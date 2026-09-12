'use client'

import { ClipboardList } from 'lucide-react'
import React from 'react'

import { useQuote } from '@/components/quote/QuoteProvider'
import { formatMoney } from '@/lib/format'

/** Gallery-only: proves the quote store is live behind the card buttons. */
export function DemoQuoteCount(): React.JSX.Element {
  const { count, estimatedTotal } = useQuote()
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <ClipboardList className="size-4 text-accent" aria-hidden />
      <span className="font-mono text-fg">{count}</span> produse în comandă
      {estimatedTotal > 0 && (
        <span className="font-mono text-faint">· estimat {formatMoney(estimatedTotal)}</span>
      )}
    </p>
  )
}

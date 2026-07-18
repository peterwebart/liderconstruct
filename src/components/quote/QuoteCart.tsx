'use client'

import { CheckCircle2, ClipboardList, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { Button, EmptyState, IconButton, PriceDisplay, QuantityStepper } from '@/components/ui'
import { useQuoteOptional } from '@/components/quote/QuoteProvider'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

import { QuoteForm } from './QuoteForm'

type View = 'cart' | 'form' | 'success'

/**
 * The inquiry cart (spec flow F): trigger with live count + right-side drawer.
 * Views: line items → contact form → confirmation. Null-safe outside the
 * QuoteProvider so the Header shell can always mount it.
 */
export function QuoteCart({
  locale = 'ro',
  variant = 'icon',
  className,
}: {
  locale?: 'ro' | 'ru'
  /** 'icon' = header trigger; 'bar' = full-width labeled trigger (mobile bar). */
  variant?: 'icon' | 'bar'
  className?: string
}): React.JSX.Element {
  const quote = useQuoteOptional()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('cart')
  const [orderNumber, setOrderNumber] = useState<number | undefined>()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const count = quote?.count ?? 0
  const hasOnRequest = quote?.items.some((i) => i.priceOnRequest) ?? false

  const openCart = (): void => {
    setView('cart')
    setOpen(true)
  }
  const triggerLabel = count > 0 ? `Comanda ta — ${count} produse` : 'Comanda ta'

  const trigger =
    variant === 'bar' ? (
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        disabled={!quote}
        onClick={openCart}
        className={cn(
          'flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-600 disabled:opacity-50',
          className,
        )}
      >
        <ClipboardList className="size-4" aria-hidden />
        Comandă
        {count > 0 && <span className="font-mono">({count > 99 ? '99+' : count})</span>}
      </button>
    ) : (
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        disabled={!quote}
        onClick={openCart}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:text-fg disabled:opacity-50',
          className,
        )}
      >
        <ClipboardList className="size-5" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 rounded-control bg-accent px-1 font-mono text-[10px] font-medium leading-4 text-accent-fg">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    )

  if (!quote) return trigger

  const title =
    view === 'form' ? 'Datele comenzii' : view === 'success' ? 'Comandă trimisă' : `Comanda ta${count > 0 ? ` (${count})` : ''}`

  return (
    <>
      {trigger}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={title}>
          <button
            type="button"
            aria-label="Închide"
            className="absolute inset-0 bg-bg/70"
            onClick={() => setOpen(false)}
          />
          <div className="drawer-pane absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium text-fg">{title}</h2>
              <button
                type="button"
                aria-label="Închide"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-control text-muted transition-colors hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {view === 'success' && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="size-10 text-stock-in" aria-hidden />
                  <p className="font-display text-lg font-medium text-fg">Mulțumim!</p>
                  <p className="max-w-xs text-sm text-muted">
                    Comanda {orderNumber != null && <span className="font-mono text-fg">#{orderNumber}</span>} a
                    fost trimisă. Vă contactăm în curând pentru confirmarea prețului final și a livrării.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                    Închide
                  </Button>
                </div>
              )}

              {view === 'form' && (
                <QuoteForm
                  locale={locale}
                  onCancel={() => setView('cart')}
                  onSuccess={(n) => {
                    setOrderNumber(n)
                    setView('success')
                    quote.clear()
                  }}
                />
              )}

              {view === 'cart' &&
                (quote.items.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="size-8" aria-hidden />}
                    title="Comanda ta este goală"
                    hint="Adaugă produse din catalog — fără plată online, un operator confirmă totul telefonic."
                    action={
                      <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                        Continuă explorarea
                      </Button>
                    }
                  />
                ) : (
                  <div>
                    {quote.items.map((item) => (
                      <div key={item.sku} className="flex gap-3 border-b border-surface-2 py-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/products/${item.productSlug}`}
                            onClick={() => setOpen(false)}
                            className="line-clamp-2 text-sm text-fg hover:underline"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11px] text-faint">
                            {[item.variationLabel, item.sku].filter(Boolean).join(' · ')}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              onChange={(q) => quote.setQuantity(item.sku, q)}
                            />
                            <IconButton label={`Elimină ${item.title}`} size="sm" onClick={() => quote.remove(item.sku)}>
                              <Trash2 className="size-3.5" aria-hidden />
                            </IconButton>
                          </div>
                        </div>
                        <div className="text-right">
                          <PriceDisplay amount={item.unitPrice} onRequest={item.priceOnRequest} size="sm" />
                          {!item.priceOnRequest && item.unitPrice != null && item.quantity > 1 && (
                            <p className="mt-1 font-mono text-xs text-muted">
                              = {formatMoney(item.unitPrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            {view === 'cart' && quote.items.length > 0 && (
              <div className="space-y-3 border-t border-border p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted">Total estimat</span>
                  <span className="font-mono text-base text-fg">{formatMoney(quote.estimatedTotal)}</span>
                </div>
                {hasOnRequest && (
                  <p className="text-xs text-faint">+ articole cu preț la cerere — se confirmă telefonic.</p>
                )}
                <p className="text-xs text-faint">
                  Fără plată online. Un operator vă sună pentru confirmare și livrare.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => quote.clear()}>
                    Șterge tot
                  </Button>
                  <Button fullWidth onClick={() => setView('form')}>
                    Trimite comanda
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

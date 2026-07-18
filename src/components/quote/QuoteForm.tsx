'use client'

import React, { useState, useTransition } from 'react'

import { submitOrder } from '@/app/actions/submit-order'
import { Button, Input } from '@/components/ui'
import { useQuote } from '@/components/quote/QuoteProvider'
import { cn } from '@/lib/cn'
import { DELIVERY_CHISINAU_MDL } from '@/lib/constants'

const textareaClass =
  'w-full rounded-control border border-border bg-surface-2 p-2.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  )
}

/**
 * Inquiry-order form (flow F): name + phone + locality required, no payment,
 * no account. Honeypot field is invisible to people; the server re-prices
 * every line and re-validates everything.
 */
export function QuoteForm({
  locale = 'ro',
  onSuccess,
  onCancel,
  className,
}: {
  locale?: 'ro' | 'ru'
  onSuccess: (orderNumber?: number) => void
  onCancel?: () => void
  className?: string
}): React.JSX.Element {
  const { items } = useQuote()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [locality, setLocality] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitOrder({
        customer: { name, phone, locality, email, address, notes },
        items: items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
        locale,
        website,
      })
      if (result.ok) onSuccess(result.orderNumber)
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)} noValidate>
      <Field label="Nume" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefon" required>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+373 …"
            required
          />
        </Field>
        <Field label="Localitate" required>
          <Input
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            autoComplete="address-level2"
            placeholder="Chișinău"
            required
          />
        </Field>
      </div>
      <Field label="Email (pentru confirmare)">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
      </Field>
      <Field label="Adresă livrare">
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          autoComplete="street-address"
          className={textareaClass}
        />
      </Field>
      <Field label="Note">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={textareaClass} />
      </Field>

      {/* Honeypot — invisible to people, filled by bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <p className="text-xs text-faint">
        Livrare în Chișinău — {DELIVERY_CHISINAU_MDL} lei; în alte localități — la înțelegere. Fără plată
        online: un operator vă sună pentru confirmarea prețului final și a livrării.
      </p>

      {error && (
        <p role="alert" className="text-sm text-stock-out">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button type="submit" fullWidth loading={pending} disabled={items.length === 0}>
          Trimite comanda
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            ← Înapoi la comandă
          </Button>
        )}
      </div>
    </form>
  )
}

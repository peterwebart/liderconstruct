import type { Metadata } from 'next'
import { Clock, Mail, Phone } from 'lucide-react'
import React from 'react'

import { Breadcrumbs } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactează LiderConstruct — telefon, email și program de lucru pentru comenzi și consultanță.',
  alternates: { canonical: '/contact' },
}

/**
 * Contact details come from environment configuration so they stay in one
 * place. Working hours are intentionally generic until a ContactSettings
 * global exists — no addresses or registration data are invented here.
 */
export default function ContactPage(): React.JSX.Element {
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ label: 'Acasă', href: '/' }, { label: 'Contact' }]} />
      <h1 className="mt-3 font-display text-2xl font-bold text-fg md:text-3xl">Contact</h1>
      <p className="mt-2 text-sm text-muted">
        Pentru comenzi, oferte sau consultanță tehnică, scrie-ne sau sună-ne direct.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-accent"
          >
            <Phone className="size-5 text-accent" aria-hidden />
            <span>
              <span className="block text-xs text-faint">Telefon</span>
              <span className="font-mono text-sm text-fg">{phone}</span>
            </span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-accent"
          >
            <Mail className="size-5 text-accent" aria-hidden />
            <span>
              <span className="block text-xs text-faint">Email</span>
              <span className="text-sm text-fg">{email}</span>
            </span>
          </a>
        )}
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 sm:col-span-2">
          <Clock className="size-5 text-accent" aria-hidden />
          <span>
            <span className="block text-xs text-faint">Program</span>
            <span className="text-sm text-fg">Luni–Vineri 8:00–17:00 · Sâmbătă 8:00–13:00</span>
          </span>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">
        Comenzile plasate în afara programului sunt confirmate în următoarea zi lucrătoare.
      </p>
    </div>
  )
}

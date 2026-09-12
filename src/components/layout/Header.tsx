'use client'

import { Phone, Truck } from 'lucide-react'
import React from 'react'

import { LocaleLink as Link } from '@/components/nav/LocaleLink'
import { LanguageSwitcher } from '@/components/nav/LanguageSwitcher'
import { MegaMenu } from '@/components/nav/MegaMenu'
import { MobileNav } from '@/components/nav/MobileNav'
import { QuoteCart } from '@/components/quote/QuoteCart'
import { SmartSearch } from '@/components/search/SmartSearch'
import { cn } from '@/lib/cn'
import type { NavBrand, NavSection, PopularTerm } from '@/lib/navigation'

function Logo(): React.JSX.Element {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="LiderConstruct — acasă">
      <span className="flex size-8 items-center justify-center rounded-[6px] bg-accent text-accent-fg" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2l9 5v10l-9 5-9-5V7z" />
        </svg>
      </span>
      <span className="font-display text-lg font-extrabold leading-none tracking-tight text-fg">
        LIDER<span className="text-accent">CONSTRUCT</span>
      </span>
    </Link>
  )
}

/**
 * Global header — deliberately minimal (change request §4/§12):
 * Catalog · Phone · Search · Language · Delivery · Cart. Everything else
 * (Soluții, Servicii, Despre, Contact, brand index) lives in the footer.
 *
 * No `backdrop-blur` here: it creates a stacking context that traps dropdowns.
 * The catalog pane is portalled to <body>, so it opens correctly over the hero
 * banner regardless of that section's `overflow-hidden`.
 */
export function Header({
  sections,
  featuredBrands = [],
  popular = [],
  locale = 'ro',
  phone,
  className,
}: {
  sections: NavSection[]
  featuredBrands?: NavBrand[]
  popular?: PopularTerm[]
  locale?: 'ro' | 'ru'
  phone?: string | null
  className?: string
}): React.JSX.Element {
  return (
    <header className={cn('sticky top-0 z-40 border-b border-border bg-surface', className)}>
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-3 md:h-16 md:gap-4 md:px-6">
        {/* Mobile: Menu (catalog) — independent from Search below. */}
        <MobileNav sections={sections} />

        <Logo />

        {/* Catalog — the single navigation entry point. */}
        <div className="hidden lg:block">
          <MegaMenu sections={sections} featuredBrands={featuredBrands} popular={popular} label="Catalog" />
        </div>

        {/* Search: the widest element, present on every page. */}
        <div className="ml-auto hidden max-w-xl flex-1 md:block lg:ml-4">
          <SmartSearch locale={locale} popular={popular} />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg lg:flex"
            >
              <Phone className="size-4 text-accent" aria-hidden />
              <span className="font-mono text-xs">{phone}</span>
            </a>
          )}
          <Link
            href="/livrare"
            className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg xl:flex"
          >
            <Truck className="size-4 text-accent" aria-hidden />
            <span className="text-xs">Livrare</span>
          </Link>
          <LanguageSwitcher locale={locale} />
          <QuoteCart locale={locale} />
        </div>
      </div>

      {/* Mobile: search pinned under the header on every page. */}
      <div className="border-t border-border px-3 pb-2.5 pt-2 md:hidden">
        <SmartSearch locale={locale} popular={popular} />
      </div>
    </header>
  )
}

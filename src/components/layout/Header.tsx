'use client'

import { Heart, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { MegaMenu } from '@/components/nav/MegaMenu'
import { MobileNav } from '@/components/nav/MobileNav'
import { QuoteCart } from '@/components/quote/QuoteCart'
import { LanguageSwitcher } from '@/components/nav/LanguageSwitcher'
import { SmartSearch } from '@/components/search/SmartSearch'
import { buttonVariants } from '@/components/ui'
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

const NAV_LINKS = [
  { label: 'Branduri', href: '/brands' },
  { label: 'Soluții', href: '/search' },
  { label: 'Servicii', href: '/search' },
  { label: 'Despre noi', href: '/despre' },
  { label: 'Contact', href: '/contact' },
]

/**
 * Global header (matches the design): logo · PRODUCTS mega menu + nav ·
 * language · account/wishlist/quote · REQUEST A QUOTE. Sticky; on mobile the
 * search bar stays pinned beneath — for a contractor on site, search IS nav.
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
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-3 md:h-16 md:gap-5 md:px-6">
        <MobileNav sections={sections}>
          <SmartSearch locale={locale} popular={popular} autoFocus />
        </MobileNav>

        <Logo />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigație principală">
          <MegaMenu sections={sections} featuredBrands={featuredBrands} popular={popular} />
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="flex h-9 items-center rounded-control px-2.5 text-sm text-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search fills the middle on md; nav takes over on lg. */}
        <div className="ml-auto hidden max-w-xs flex-1 md:block lg:hidden">
          <SmartSearch locale={locale} popular={popular} />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSwitcher locale={locale} />
          <Link
            href="/contul-meu"
            aria-label="Contul meu"
            className="hidden size-9 items-center justify-center rounded-control text-muted transition-colors hover:text-fg sm:flex"
          >
            <User className="size-5" aria-hidden />
          </Link>
          <Link
            href="/favorite"
            aria-label="Favorite"
            className="hidden size-9 items-center justify-center rounded-control text-muted transition-colors hover:text-fg sm:flex"
          >
            <Heart className="size-5" aria-hidden />
          </Link>
          <QuoteCart locale={locale} />
          <Link
            href={phone ? `tel:${phone.replace(/\s/g, '')}` : '/contact'}
            className={buttonVariants({ size: 'sm', className: 'ml-1 hidden font-semibold sm:inline-flex' })}
          >
            Cere ofertă
          </Link>
        </div>
      </div>

      {/* Mobile: search pinned under the header on every screen. */}
      <div className="border-t border-border px-3 pb-2.5 pt-2 md:hidden">
        <SmartSearch locale={locale} popular={popular} />
      </div>
    </header>
  )
}

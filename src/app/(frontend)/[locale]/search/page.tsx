import type { Metadata } from 'next'
import React from 'react'

import { CatalogListing, type PageSearchParams } from '@/components/catalog/CatalogListing'
import { SmartSearch } from '@/components/search/SmartSearch'
import { toLocale } from '@/lib/i18n'
import { getPopularSearches } from '@/lib/navigation'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<PageSearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  return {
    title: q ? `Căutare: „${q}”` : 'Căutare',
    robots: { index: false, follow: true },
  }
}

/** Search results (flow A): the same faceted listing, scoped by term. */
export default async function SearchPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const locale = toLocale((await params).locale)
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''

  if (!q) {
    const popular = await getPopularSearches(locale)
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 md:px-6">
        <h1 className="font-display text-2xl font-bold text-fg">Caută în catalog</h1>
        <p className="mt-1 text-sm text-muted">Produs, SKU, brand sau categorie — cu sau fără diacritice.</p>
        <div className="mt-4">
          <SmartSearch size="lg" autoFocus popular={popular} locale={locale} />
        </div>
      </div>
    )
  }

  return (
    <CatalogListing
      heading={
        <>
          Rezultate pentru <span className="text-accent">„{q}”</span>
        </>
      }
      breadcrumbs={[{ label: 'Acasă', href: '/' }, { label: 'Căutare' }]}
      context={{ term: q, locale }}
      searchParams={sp}
      path="/search"
      emptyTitle={`Niciun rezultat pentru „${q}”`}
      emptyHint="Verifică ortografia, încearcă un termen mai general sau caută după SKU. Poți cere produsul și telefonic."
    />
  )
}

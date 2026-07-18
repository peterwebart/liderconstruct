import type { Metadata } from 'next'
import React from 'react'

import { CatalogListing, type PageSearchParams } from '@/components/catalog/CatalogListing'
import { SmartSearch } from '@/components/search/SmartSearch'
import { getPopularSearches } from '@/lib/navigation'

interface Props {
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
export default async function SearchPage({ searchParams }: Props): Promise<React.JSX.Element> {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''

  if (!q) {
    const popular = await getPopularSearches('ro')
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 md:px-6">
        <h1 className="font-display text-2xl font-bold text-fg">Caută în catalog</h1>
        <p className="mt-1 text-sm text-muted">Produs, SKU, brand sau categorie — cu sau fără diacritice.</p>
        <div className="mt-4">
          <SmartSearch size="lg" autoFocus popular={popular} />
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
      context={{ term: q }}
      searchParams={sp}
      path="/search"
      emptyTitle={`Niciun rezultat pentru „${q}”`}
      emptyHint="Verifică ortografia, încearcă un termen mai general sau caută după SKU. Poți cere produsul și telefonic."
    />
  )
}

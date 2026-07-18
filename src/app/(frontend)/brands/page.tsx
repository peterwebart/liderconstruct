import type { Metadata } from 'next'
import React from 'react'

import { BrandCard } from '@/components/catalog/BrandCard'
import { Breadcrumbs, EmptyState } from '@/components/ui'
import { getBrandsIndex } from '@/lib/catalog'
import { formatCount } from '@/lib/format'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Branduri',
  description: 'Toate brandurile din catalogul LiderConstruct — producători verificați de materiale de construcție.',
  alternates: { canonical: '/brands' },
}

/** Brand index (flow C entry): every active brand with catalog size. */
export default async function BrandsPage(): Promise<React.JSX.Element> {
  const brands = await getBrandsIndex()
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
      <Breadcrumbs items={[{ label: 'Acasă', href: '/' }, { label: 'Branduri' }]} />
      <header className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-bold text-fg md:text-3xl">Branduri</h1>
        <span className="font-mono text-sm text-faint">{formatCount(brands.length)}</span>
      </header>
      {brands.length === 0 ? (
        <EmptyState title="Brandurile apar după primul import" className="mt-8" />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <BrandCard key={b.id} name={b.name} href={`/brand/${b.slug}`} count={b.count} />
          ))}
        </div>
      )}
    </div>
  )
}

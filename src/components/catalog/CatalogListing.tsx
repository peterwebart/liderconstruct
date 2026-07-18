import { SearchX } from 'lucide-react'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductList } from '@/components/catalog/ProductList'
import { Pagination } from '@/components/catalog/Pagination'
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips'
import { FilterSidebar } from '@/components/filters/FilterSidebar'
import { MobileFilters } from '@/components/filters/MobileFilters'
import { SortControl } from '@/components/filters/SortControl'
import { Breadcrumbs, EmptyState, type Crumb } from '@/components/ui'
import { getCatalogFacets, getCatalogPage, type CatalogContext } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import { countActiveFilters, parseFilters, searchParamsToURLSearchParams } from '@/lib/filter-params'

export type PageSearchParams = Record<string, string | string[] | undefined>

/**
 * The faceted listing every catalog surface shares (category / search / brand
 * — spec §5.4). Server component: facets + the filtered page load in parallel;
 * the live result count feeds the mobile "Aplică" button.
 */
export async function CatalogListing({
  heading,
  breadcrumbs,
  context,
  searchParams,
  path,
  subcategories = [],
  intro,
  emptyTitle = 'Niciun produs găsit',
  emptyHint = 'Șterge filtrele sau încearcă un alt termen de căutare.',
  className,
}: {
  heading: React.ReactNode
  breadcrumbs: Crumb[]
  context: CatalogContext
  searchParams: PageSearchParams
  /** Current pathname, for pagination links. */
  path: string
  subcategories?: { id: number; title: string; href: string }[]
  intro?: string | null
  emptyTitle?: string
  emptyHint?: string
  className?: string
}): Promise<React.JSX.Element> {
  const params = searchParamsToURLSearchParams(searchParams)
  const filters = parseFilters(params)
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [facetsData, pageData] = await Promise.all([
    getCatalogFacets(context),
    getCatalogPage(context, filters, page),
  ])
  const hasActiveFilters = countActiveFilters(filters) > 0

  return (
    <div className={cn('mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6', className)}>
      <Breadcrumbs items={breadcrumbs} />

      <header className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-bold text-fg md:text-3xl">{heading}</h1>
        <span className="font-mono text-sm text-faint">{formatCount(pageData.total)} produse</span>
      </header>
      {intro && <p className="mt-2 max-w-2xl text-sm text-muted">{intro}</p>}

      {subcategories.length > 0 && (
        <nav aria-label="Subcategorii" className="mt-4 flex flex-wrap gap-1.5">
          {subcategories.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="rounded-control border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {c.title}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
        <Suspense fallback={null}>
          <FilterSidebar data={facetsData} className="hidden md:block" />
        </Suspense>

        <div className="min-w-0 space-y-3">
          <Suspense fallback={null}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MobileFilters data={facetsData} resultCount={pageData.total} />
              <SortControl className="ml-auto" />
            </div>
            <ActiveFilterChips data={facetsData} />
          </Suspense>

          {pageData.products.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-8" aria-hidden />}
              title={emptyTitle}
              hint={emptyHint}
              action={
                hasActiveFilters ? (
                  <Link
                    href={path}
                    className="rounded-control border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-faint hover:text-fg"
                  >
                    Șterge filtrele
                  </Link>
                ) : undefined
              }
            />
          ) : filters.view === 'list' ? (
            <ProductList products={pageData.products} />
          ) : (
            <ProductGrid products={pageData.products} className="grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          )}

          <Pagination
            page={pageData.page}
            pageCount={pageData.pageCount}
            path={path}
            searchParams={searchParams}
            className="pt-3"
          />
        </div>
      </div>
    </div>
  )
}

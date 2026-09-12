import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { CatalogListing, type PageSearchParams } from '@/components/catalog/CatalogListing'
import { getCategoryContext } from '@/lib/catalog'
import { toLocale } from '@/lib/i18n'

interface Props {
  params: Promise<{ locale: string; section: string; category: string }>
  searchParams: Promise<PageSearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section, category } = await params
  const node = await getCategoryContext(category, toLocale(locale))
  if (!node) return { title: 'Categorie' }
  return {
    title: node.title,
    description: `${node.title} — catalog LiderConstruct: prețuri, stoc și livrare în toată Moldova.`,
    alternates: { canonical: `/category/${section}/${category}` },
  }
}

/** Category page (spec §5.4): breadcrumbs + facets + grid, canonical under
 * its own section — a mismatched section slug 404s rather than duplicating. */
export default async function CategoryPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { locale: raw, section, category } = await params
  const locale = toLocale(raw)
  const sp = await searchParams
  const node = await getCategoryContext(category, locale)
  if (!node || node.level === 'section' || node.trail[0]?.slug !== section) notFound()

  return (
    <CatalogListing
      heading={node.title}
      breadcrumbs={[
        { label: 'Acasă', href: '/' },
        ...node.trail.slice(0, -1).map((t) => ({ label: t.title, href: t.href })),
        { label: node.title },
      ]}
      context={{ categorySlug: category, locale }}
      searchParams={sp}
      path={`/category/${section}/${category}`}
      subcategories={node.children}
    />
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { CatalogListing, type PageSearchParams } from '@/components/catalog/CatalogListing'
import { getCategoryContext } from '@/lib/catalog'

interface Props {
  params: Promise<{ section: string }>
  searchParams: Promise<PageSearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  const node = await getCategoryContext(section)
  if (!node) return { title: 'Categorie' }
  return {
    title: node.title,
    description: `${node.title} — catalog LiderConstruct: prețuri, stoc și livrare în toată Moldova.`,
    alternates: { canonical: `/category/${section}` },
  }
}

/** Section landing: faceted listing over the whole section + category chips. */
export default async function SectionPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { section } = await params
  const sp = await searchParams
  const node = await getCategoryContext(section)
  if (!node || node.level !== 'section') notFound()

  return (
    <CatalogListing
      heading={node.title}
      breadcrumbs={[{ label: 'Acasă', href: '/' }, { label: node.title }]}
      context={{ categorySlug: section }}
      searchParams={sp}
      path={`/category/${section}`}
      subcategories={node.children}
    />
  )
}

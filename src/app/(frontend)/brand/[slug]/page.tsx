import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { CatalogListing, type PageSearchParams } from '@/components/catalog/CatalogListing'
import { getBrandBySlug } from '@/lib/catalog'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<PageSearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) return { title: 'Brand' }
  return {
    title: `${brand.name} — produse și prețuri`,
    description: `Catalogul ${brand.name} la LiderConstruct: ${brand.count} produse cu prețuri și stoc actualizat.`,
    alternates: { canonical: `/brand/${slug}` },
  }
}

/** Brand page (flow C): the shared faceted listing scoped by brand. */
export default async function BrandPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { slug } = await params
  const sp = await searchParams
  const brand = await getBrandBySlug(slug)
  if (!brand) notFound()

  return (
    <CatalogListing
      heading={brand.name}
      breadcrumbs={[
        { label: 'Acasă', href: '/' },
        { label: 'Branduri', href: '/brands' },
        { label: brand.name },
      ]}
      context={{ brandSlug: slug }}
      searchParams={sp}
      path={`/brand/${slug}`}
    />
  )
}

import React from 'react'

import { getNavigation, getPopularSearches } from '@/lib/navigation'

import { Header } from './Header'
import { TopBar } from './TopBar'

/**
 * Server wrapper: fetches the CMS-driven navigation (cached, fail-safe) and
 * renders the client Header. Mounted on the storefront layout in the pages
 * increment.
 */
export async function SiteHeader({
  locale = 'ro',
}: {
  locale?: 'ro' | 'ru'
}): Promise<React.JSX.Element> {
  const [nav, popular] = await Promise.all([getNavigation(locale), getPopularSearches(locale)])
  return (
    <>
      <TopBar />
      <Header
      sections={nav.sections}
      featuredBrands={nav.featuredBrands}
      popular={popular}
      locale={locale}
        phone={process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null}
      />
    </>
  )
}

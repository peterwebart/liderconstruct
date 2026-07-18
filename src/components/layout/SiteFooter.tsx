import React from 'react'

import { getNavigation } from '@/lib/navigation'

import { Footer } from './Footer'

/** Server wrapper: same cached navigation source as the header. */
export async function SiteFooter({
  locale = 'ro',
}: {
  locale?: 'ro' | 'ru'
}): Promise<React.JSX.Element> {
  const nav = await getNavigation(locale)
  return (
    <Footer
      sections={nav.sections}
      featuredBrands={nav.featuredBrands}
      phone={process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null}
      email={process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null}
    />
  )
}

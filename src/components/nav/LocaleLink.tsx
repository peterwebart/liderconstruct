'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

import { localePath, toLocale } from '@/lib/i18n'

/**
 * Locale-aware <Link>: takes a locale-agnostic href ("/brands") and prefixes
 * the current locale from the route ("/ro/brands"). Centralizes prefixing so
 * call sites never hardcode /ro or /ru. External/anchor/tel/mailto hrefs pass
 * through untouched.
 */
export function LocaleLink({
  href,
  children,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }): React.JSX.Element {
  const params = useParams()
  const locale = toLocale(params?.locale)
  const isInternal = href.startsWith('/') && !href.startsWith('//')
  const finalHref = isInternal ? localePath(locale, href) : href
  return (
    <Link href={finalHref} {...rest}>
      {children}
    </Link>
  )
}

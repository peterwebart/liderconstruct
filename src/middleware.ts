import { type NextRequest, NextResponse } from 'next/server'

import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'

/**
 * Locale routing (ADR-0009). Storefront URLs live under /[locale]. A request
 * without a locale prefix is redirected to the default locale, preserving the
 * path and query. Admin, API, Next internals, and static files are left alone
 * so Payload and asset serving are unaffected.
 */

// Paths that must NOT be locale-prefixed.
const EXCLUDED = [
  '/admin',
  '/api',
  '/_next',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
]

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  if (EXCLUDED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }
  // Files with an extension (images, fonts, etc.) — leave alone.
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return NextResponse.next()

  const first = pathname.split('/')[1]
  if (isLocale(first)) return NextResponse.next()

  // No locale prefix → redirect to the default locale, preserving path+query.
  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Run on everything except Next internals & files; the handler itself
  // re-checks excluded API/admin paths above for clarity.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

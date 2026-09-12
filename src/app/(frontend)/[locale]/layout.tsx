import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import { FloatingContactBar } from '@/components/layout/FloatingContactBar'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { QuoteProvider } from '@/components/quote/QuoteProvider'
import { isLocale, LOCALES, type Locale } from '@/lib/i18n'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://liderconstruct.md'

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
})
const jbMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['500'],
  variable: '--font-jbmono',
  display: 'swap',
})

/** Pre-render both locale shells. */
export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

const HTML_LANG: Record<Locale, string> = { ro: 'ro-MD', ru: 'ru-MD' }
const OG_LOCALE: Record<Locale, string> = { ro: 'ro_MD', ru: 'ru_MD' }

const META: Record<Locale, { title: string; template: string; description: string }> = {
  ro: {
    title: 'LiderConstruct — Materiale de construcție în Moldova',
    template: '%s | LiderConstruct',
    description:
      'Mii de produse, branduri de top, prețuri avantajoase. Tot ce ai nevoie pentru proiectele tale de construcție, livrare rapidă în toată Moldova.',
  },
  ru: {
    title: 'LiderConstruct — Строительные материалы в Молдове',
    template: '%s | LiderConstruct',
    description:
      'Тысячи товаров, ведущие бренды, выгодные цены. Всё для ваших строительных проектов и быстрая доставка по всей Молдове.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'ro'
  const m = META[locale]
  return {
    metadataBase: new URL(SERVER_URL),
    title: { default: m.title, template: m.template },
    description: m.description,
    applicationName: 'LiderConstruct',
    openGraph: {
      type: 'website',
      siteName: 'LiderConstruct',
      locale: OG_LOCALE[locale],
      url: `${SERVER_URL}/${locale}`,
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      canonical: `/${locale}`,
      languages: { 'ro-MD': '/ro', 'ru-MD': '/ru' },
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0b0e12',
  width: 'device-width',
  initialScale: 1,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}): Promise<React.JSX.Element> {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale: Locale = raw

  // Site-wide structured data (change request §18). Emitted once per page in
  // the layout: Organization identifies the business, WebSite declares the
  // search action. Only real, configured values are included.
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LiderConstruct',
    url: SERVER_URL,
    ...(process.env.NEXT_PUBLIC_CONTACT_PHONE
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
            contactType: 'sales',
            areaServed: 'MD',
            availableLanguage: ['ro', 'ru'],
          },
        }
      : {}),
    ...(process.env.NEXT_PUBLIC_CONTACT_EMAIL ? { email: process.env.NEXT_PUBLIC_CONTACT_EMAIL } : {}),
  }
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LiderConstruct',
    url: `${SERVER_URL}/${locale}`,
    inLanguage: HTML_LANG[locale],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SERVER_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang={HTML_LANG[locale]} className={`${inter.variable} ${archivo.variable} ${jbMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <QuoteProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader locale={locale} />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <SiteFooter locale={locale} />
          </div>
          <FloatingContactBar phone={process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null} locale={locale} />
        </QuoteProvider>
      </body>
    </html>
  )
}

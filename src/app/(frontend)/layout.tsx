import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google'
import React from 'react'

import { FloatingContactBar } from '@/components/layout/FloatingContactBar'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { QuoteProvider } from '@/components/quote/QuoteProvider'

import './globals.css'

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

export const metadata: Metadata = {
  metadataBase: new URL(SERVER_URL),
  title: {
    default: 'LiderConstruct — Materiale de construcție în Moldova',
    template: '%s | LiderConstruct',
  },
  description:
    'Mii de produse, branduri de top, prețuri avantajoase. Tot ce ai nevoie pentru proiectele tale de construcție, livrare rapidă în toată Moldova.',
  applicationName: 'LiderConstruct',
  openGraph: { type: 'website', siteName: 'LiderConstruct', locale: 'ro_MD', url: SERVER_URL },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#0b0e12',
  width: 'device-width',
  initialScale: 1,
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${archivo.variable} ${jbMono.variable}`}>
      <body>
        <QuoteProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <SiteFooter />
          </div>
          <FloatingContactBar phone={process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null} />
        </QuoteProvider>
      </body>
    </html>
  )
}

import type { MetadataRoute } from 'next'

import { LOCALES } from '@/lib/i18n'
import { getSitemapEntries } from '@/lib/seo'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://liderconstruct.md'

/** Dynamic sitemap: every published product, category node, brand, and the
 * static pages — emitted for each locale (/ro/…, /ru/…) with hreflang
 * alternates. Regenerated hourly and after imports via the 'catalog' tag. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SERVER_URL.replace(/\/$/, '')
  const entries = await getSitemapEntries()
  return entries.flatMap((e) =>
    LOCALES.map((locale) => ({
      url: `${base}/${locale}${e.path === '/' ? '' : e.path}`,
      lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
      changeFrequency: e.changeFrequency,
      priority: e.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [
            l === 'ro' ? 'ro-MD' : 'ru-MD',
            `${base}/${l}${e.path === '/' ? '' : e.path}`,
          ]),
        ),
      },
    })),
  )
}

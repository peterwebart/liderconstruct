import type { MetadataRoute } from 'next'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://liderconstruct.md'

/** robots.txt: allow crawling, keep bots out of admin/api/dev and search-result
 * permutations, and point to the sitemap. (There are no customer accounts —
 * the storefront is guest-only.) */
export default function robots(): MetadataRoute.Robots {
  const base = SERVER_URL.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/dev/', '/search'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

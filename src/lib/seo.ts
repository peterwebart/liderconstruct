import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Category } from '@/payload-types'

/**
 * Sitemap URL enumeration. Lists every publicly indexable route with a
 * last-modified date, mirroring the canonical URL shapes the pages declare
 * (products/[slug], category/[section]{/[category]}, brand/[slug]). Cached
 * under the 'catalog' + 'navigation' tags so it refreshes after imports and
 * taxonomy edits. Fail-safe: on any error it returns just the static routes
 * so the sitemap is always valid.
 */

export interface SitemapEntry {
  path: string
  lastModified?: string
  changeFrequency?: 'daily' | 'weekly' | 'monthly'
  priority?: number
}

/** Static, always-present routes. */
const STATIC_ENTRIES: SitemapEntry[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/brands', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/despre', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/livrare', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/termeni', changeFrequency: 'monthly', priority: 0.2 },
]

const loadSitemapEntries = async (): Promise<SitemapEntry[]> => {
  try {
    const payload = await getPayload({ config })
    const [products, categories, brands] = await Promise.all([
      payload.find({
        collection: 'products',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { lifecycle: { not_in: ['hidden', 'archived', 'draft'] } },
          ],
        },
        limit: 100000,
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'categories',
        limit: 5000,
        pagination: false,
        depth: 0,
        select: { slug: true, level: true, parent: true, updatedAt: true },
      }),
      payload.find({
        collection: 'brands',
        where: { status: { equals: 'active' } },
        limit: 5000,
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
    ])

    // Category hrefs mirror the page canonicals: sections at /category/<slug>,
    // deeper nodes at /category/<sectionSlug>/<slug>.
    type CatNode = {
      id: number
      slug: string
      level: Category['level']
      parent?: number | { id: number } | null
      updatedAt?: string | null
    }
    const byId = new Map<number, CatNode>(categories.docs.map((c) => [c.id, c as CatNode]))
    const sectionSlugOf = (node: CatNode): string | null => {
      let cur: CatNode | undefined = node
      for (let i = 0; cur && i < 5; i++) {
        if (cur.level === 'section') return cur.slug
        const parent: number | { id: number } | null | undefined = cur.parent
        const pid: number | undefined = typeof parent === 'number' ? parent : parent?.id
        cur = pid != null ? byId.get(pid) : undefined
      }
      return null
    }

    const categoryEntries: SitemapEntry[] = categories.docs.flatMap((c): SitemapEntry[] => {
      const section = sectionSlugOf(c as CatNode)
      if (!section) return []
      const path = c.level === 'section' ? `/category/${c.slug}` : `/category/${section}/${c.slug}`
      return [
        {
          path,
          lastModified: c.updatedAt ?? undefined,
          changeFrequency: 'weekly',
          priority: c.level === 'section' ? 0.8 : 0.7,
        },
      ]
    })

    const productEntries: SitemapEntry[] = products.docs
      .filter((p) => p.slug)
      .map((p) => ({
        path: `/products/${p.slug}`,
        lastModified: p.updatedAt ?? undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))

    const brandEntries: SitemapEntry[] = brands.docs
      .filter((b) => b.slug)
      .map((b) => ({
        path: `/brand/${b.slug}`,
        lastModified: b.updatedAt ?? undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))

    return [...STATIC_ENTRIES, ...categoryEntries, ...brandEntries, ...productEntries]
  } catch {
    return STATIC_ENTRIES
  }
}

export const getSitemapEntries = (): Promise<SitemapEntry[]> =>
  unstable_cache(loadSitemapEntries, ['sitemap-entries'], {
    revalidate: 3600,
    tags: ['catalog', 'navigation'],
  })()

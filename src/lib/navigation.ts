import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

/**
 * Navigation data layer — everything the Header/MegaMenu render is derived
 * from the internal taxonomy + CMS globals. Nothing hardcoded (ADR-0005).
 * Cached for 5 minutes; fails safe to empty structures so the shell renders
 * even before the first import.
 */

export interface NavCategory {
  id: number
  title: string
  slug: string
  href: string
  count: number
  featured: boolean
}

export interface NavSection {
  id: number
  title: string
  slug: string
  href: string
  icon: string | null
  count: number
  children: NavCategory[]
}

export interface NavBrand {
  id: number
  name: string
  slug: string
  href: string
}

export interface PopularTerm {
  label: string
  query: string
}

export interface NavigationData {
  sections: NavSection[]
  featuredBrands: NavBrand[]
}

const byOrder = <T extends { displayOrder?: number | null; title?: string; name?: string }>(a: T, b: T): number =>
  (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
  String(a.title ?? a.name ?? '').localeCompare(String(b.title ?? b.name ?? ''), 'ro')

async function loadNavigation(locale: 'ro' | 'ru'): Promise<NavigationData> {
  try {
    const payload = await getPayload({ config })

    const [categories, brands, products] = await Promise.all([
      payload.find({ collection: 'categories', limit: 500, pagination: false, depth: 0, locale }),
      payload.find({
        collection: 'brands',
        where: { and: [{ featured: { equals: true } }, { status: { equals: 'active' } }] },
        sort: 'displayOrder',
        limit: 8,
        depth: 0,
      }),
      payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        limit: 10000,
        pagination: false,
        depth: 0,
        select: { category: true },
      }),
    ])

    // Direct product counts per taxonomy node.
    const counts = new Map<number, number>()
    for (const p of products.docs) {
      const cid = typeof p.category === 'number' ? p.category : p.category?.id
      if (cid != null) counts.set(cid, (counts.get(cid) ?? 0) + 1)
    }

    const sections = categories.docs
      .filter((c) => c.level === 'section')
      .sort(byOrder)
      .map((section): NavSection => {
        const children = categories.docs
          .filter((c) => {
            const pid = typeof c.parent === 'number' ? c.parent : c.parent?.id
            return pid === section.id && c.level === 'category'
          })
          .sort(byOrder)
          .map(
            (c): NavCategory => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              href: `/category/${section.slug}/${c.slug}`,
              count: counts.get(c.id) ?? 0,
              featured: Boolean(c.featured),
            }),
          )
        return {
          id: section.id,
          title: section.title,
          slug: section.slug,
          href: `/category/${section.slug}`,
          icon: section.icon ?? null,
          count: children.reduce((n, c) => n + c.count, counts.get(section.id) ?? 0),
          children,
        }
      })

    const featuredBrands: NavBrand[] = brands.docs.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      href: `/brand/${b.slug}`,
    }))

    return { sections, featuredBrands }
  } catch {
    return { sections: [], featuredBrands: [] }
  }
}

async function loadPopularSearches(locale: 'ro' | 'ru'): Promise<PopularTerm[]> {
  try {
    const payload = await getPayload({ config })
    const homepage = await payload.findGlobal({ slug: 'homepage', depth: 0, locale })
    const block = (homepage.sections ?? []).find((s) => s.blockType === 'popularSearches')
    if (!block || block.blockType !== 'popularSearches') return []
    return (block.terms ?? [])
      .filter((t): t is { label: string; query: string; id?: string | null } => Boolean(t.label && t.query))
      .map((t) => ({ label: t.label, query: t.query }))
  } catch {
    return []
  }
}

export const getNavigation = (locale: 'ro' | 'ru' = 'ro'): Promise<NavigationData> =>
  unstable_cache(loadNavigation, ['navigation'], { revalidate: 300, tags: ['navigation'] })(locale)

export const getPopularSearches = (locale: 'ro' | 'ru' = 'ro'): Promise<PopularTerm[]> =>
  unstable_cache(loadPopularSearches, ['popular-searches'], { revalidate: 300, tags: ['navigation'] })(locale)

/** Distinct application areas (the "Pe aplicație" discovery axis). */
export interface ApplicationTerm {
  label: string
  count: number
}

const loadApplications = async (locale: 'ro' | 'ru'): Promise<ApplicationTerm[]> => {
  try {
    const payload = await getPayload({ config })
    const products = await payload.find({
      collection: 'products',
      where: { _status: { equals: 'published' } },
      limit: 10000,
      pagination: false,
      depth: 0,
      locale,
      select: { applicationArea: true },
    })
    const counts = new Map<string, number>()
    for (const p of products.docs) {
      const label = (p.applicationArea ?? '').trim()
      if (!label) continue
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  } catch {
    return []
  }
}

export const getApplications = (locale: 'ro' | 'ru' = 'ro'): Promise<ApplicationTerm[]> =>
  unstable_cache(loadApplications, ['applications'], { revalidate: 300, tags: ['navigation'] })(locale)

/** Featured brands, falling back to top brands by catalog size until curated. */
export interface TopBrand extends NavBrand {
  count: number
}

const loadTopBrands = async (limit: number): Promise<TopBrand[]> => {
  try {
    const payload = await getPayload({ config })
    const [brands, products] = await Promise.all([
      payload.find({
        collection: 'brands',
        where: { status: { equals: 'active' } },
        limit: 300,
        pagination: false,
        depth: 0,
      }),
      payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        limit: 10000,
        pagination: false,
        depth: 0,
        select: { brand: true },
      }),
    ])
    const counts = new Map<number, number>()
    for (const p of products.docs) {
      const bid = typeof p.brand === 'number' ? p.brand : p.brand?.id
      if (bid != null) counts.set(bid, (counts.get(bid) ?? 0) + 1)
    }
    const featured = brands.docs.filter((b) => b.featured)
    const pool = featured.length > 0 ? featured : brands.docs
    return pool
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        href: `/brand/${b.slug}`,
        count: counts.get(b.id) ?? 0,
      }))
      .filter((b) => b.count > 0)
      .sort(
        (a, b) =>
          b.count - a.count || a.name.localeCompare(b.name, 'ro'),
      )
      .slice(0, limit)
  } catch {
    return []
  }
}

export const getTopBrands = (limit = 8): Promise<TopBrand[]> =>
  unstable_cache(loadTopBrands, ['top-brands'], { revalidate: 300, tags: ['navigation'] })(limit)

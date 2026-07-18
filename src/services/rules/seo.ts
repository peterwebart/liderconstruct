import type { SeoRulesConfig } from './config'

export interface SeoProductInput {
  name: string
  brand?: string | null
  sectionTitle?: string | null
  categoryPath?: string[]
  slug: string
  shortDescription?: string | null
  priceMin?: number | null
  priceOnRequest?: boolean
  keyAttributes?: string[]
}
export interface GeneratedSeo {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  canonical: string
}

const clamp = (s: string, max: number): string => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`)

export function generateMetaTitle(p: SeoProductInput, cfg: SeoRulesConfig): string {
  const t = cfg.titleTemplate
    .replace('{name}', p.name)
    .replace('{brand}', p.brand ?? '')
    .replace('{section}', p.sectionTitle ?? '')
    .replace(/\s+—\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return clamp(t, cfg.maxTitle)
}
export function generateMetaDescription(p: SeoProductInput, cfg: SeoRulesConfig): string {
  const base =
    p.shortDescription ??
    [p.name, p.brand, ...(p.keyAttributes ?? [])].filter(Boolean).join(', ')
  return clamp(base, cfg.maxDescription)
}
export function generateKeywords(p: SeoProductInput): string[] {
  return Array.from(
    new Set(
      [p.name, p.brand, ...(p.categoryPath ?? []), ...(p.keyAttributes ?? [])]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase()),
    ),
  )
}
export function generateCanonical(slug: string, locale: string, baseUrl: string): string {
  const prefix = locale === 'ro' ? '' : `/${locale}`
  return `${baseUrl}${prefix}/products/${slug}`
}
export function generateBreadcrumbs(p: SeoProductInput): Array<{ name: string; position: number }> {
  return [...(p.categoryPath ?? []), p.name].map((name, i) => ({ name, position: i + 1 }))
}
/** schema.org Product + Offer. Availability/price reflect catalog state. */
export function generateProductJsonLd(p: SeoProductInput, baseUrl: string, locale: string): Record<string, unknown> {
  const offer: Record<string, unknown> = p.priceOnRequest
    ? { '@type': 'Offer', availability: 'https://schema.org/InStock', priceCurrency: 'MDL' }
    : {
        '@type': 'Offer',
        priceCurrency: 'MDL',
        price: p.priceMin ?? undefined,
        availability: 'https://schema.org/InStock',
      }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    url: generateCanonical(p.slug, locale, baseUrl),
    offers: offer,
  }
}

/** Fills only empty SEO fields — manual edits always win. */
export function applySeoDefaults(
  existing: { metaTitle?: string | null; metaDescription?: string | null } | undefined,
  p: SeoProductInput,
  cfg: SeoRulesConfig,
  locale: string,
  baseUrl: string,
): GeneratedSeo {
  return {
    metaTitle: existing?.metaTitle?.trim() || generateMetaTitle(p, cfg),
    metaDescription: existing?.metaDescription?.trim() || generateMetaDescription(p, cfg),
    keywords: generateKeywords(p),
    canonical: generateCanonical(p.slug, locale, baseUrl),
  }
}

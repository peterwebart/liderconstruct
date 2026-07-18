import { ArrowRight, Phone } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { BrandCard } from '@/components/catalog/BrandCard'
import { CategoryCard } from '@/components/catalog/CategoryCard'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { HomeHero } from '@/components/home/HomeHero'
import { buttonVariants } from '@/components/ui'
import { getHomepageData } from '@/lib/homepage'
import { getNavigation, getPopularSearches, getTopBrands } from '@/lib/navigation'

export const revalidate = 300

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string | null
  action?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 className="font-display text-lg font-medium text-fg md:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * Homepage — the discovery hub (spec §5.1). The first screen is the design's
 * hero: banner + 3-step finder + top brands. Everything below is
 * CMS/taxonomy-driven with live fallbacks, useful from the first import onward.
 */
export default async function HomePage(): Promise<React.JSX.Element> {
  const locale = 'ro' as const
  const [nav, popular, topBrands, home] = await Promise.all([
    getNavigation(locale),
    getPopularSearches(locale),
    getTopBrands(8),
    getHomepageData(locale),
  ])
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE

  return (
    <>
      <HomeHero sections={nav.sections} brands={topBrands} popular={popular} stats={home.stats} />

      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">

      {/* Quick access: every section, straight from the taxonomy. */}
      {nav.sections.length > 0 && (
        <section className="py-8">
          <SectionHeading title="Secțiuni" subtitle="Tot catalogul, organizat pe lucrări" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {nav.sections.map((s) => (
              <CategoryCard key={s.id} title={s.title} href={s.href} count={s.count} icon={s.icon} size="sm" />
            ))}
          </div>
        </section>
      )}

      {topBrands.length > 0 && (
        <>
          <div className="tick-rule" aria-hidden />
          <section className="py-8">
            <SectionHeading
              title="Branduri de top"
              action={
                <Link href="/brands" className="flex items-center gap-1 text-xs text-accent hover:underline">
                  Toate brandurile <ArrowRight className="size-3" aria-hidden />
                </Link>
              }
            />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {topBrands.map((b) => (
                <BrandCard key={b.id} name={b.name} href={b.href} count={b.count} />
              ))}
            </div>
          </section>
        </>
      )}

      {home.featuredCategories && (
        <>
          <div className="tick-rule" aria-hidden />
          <section className="py-8">
            <SectionHeading
              title={home.featuredCategories.header.title ?? 'Categorii recomandate'}
              subtitle={home.featuredCategories.header.subtitle}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {home.featuredCategories.items.map((c) => (
                <CategoryCard key={c.id} title={c.title} href={c.href} icon={c.icon} />
              ))}
            </div>
          </section>
        </>
      )}

      {home.productStrip && (
        <>
          <div className="tick-rule" aria-hidden />
          <section className="py-8">
            <SectionHeading
              title={home.productStrip.header.title ?? 'Produse din catalog'}
              subtitle={home.productStrip.header.subtitle}
            />
            <ProductGrid products={home.productStrip.items} className="mt-4 xl:grid-cols-4" />
          </section>
        </>
      )}

      {/* Quote CTA strip (flow F entry). */}
      <section className="pb-12 pt-4">
        <div className="flex flex-col justify-between gap-4 rounded-card border border-border bg-surface p-6 md:flex-row md:items-center md:p-8">
          <div>
            <h2 className="font-display text-lg font-medium text-fg md:text-xl">
              Ai o listă de materiale pentru proiect?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Adaugă produsele în comandă sau sună-ne direct — pregătim oferta și confirmăm livrarea în
              aceeași zi lucrătoare.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className={buttonVariants({ size: 'lg' })}>
                <Phone className="size-4" aria-hidden />
                Sună acum
              </a>
            )}
            <Link href="/search" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              Explorează catalogul
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

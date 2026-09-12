import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { BuyPanel } from '@/components/product/BuyPanel'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductSeoContent } from '@/components/product/ProductSeoContent'
import { ProductTabs } from '@/components/product/ProductTabs'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { RichTextBlock } from '@/components/product/RichTextBlock'
import { SpecificationTable } from '@/components/product/SpecificationTable'
import { Breadcrumbs } from '@/components/ui'
import { getProductCards, getProductPageData } from '@/lib/catalog'
import { toLocale } from '@/lib/i18n'
import { buildIdentityGroup, buildSpecGroups } from '@/lib/specs'

export const revalidate = 300

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const data = await getProductPageData(slug, toLocale(locale))
  if (!data) return { title: 'Produs' }
  return {
    title: data.seo.metaTitle || data.title,
    description:
      data.seo.metaDescription ||
      `${data.title} — preț, specificații și disponibilitate la LiderConstruct. Livrare în toată Moldova.`,
    alternates: { canonical: `/products/${slug}` },
  }
}

/** Product detail (spec §5.5): decision panel + registry-driven spec sheet. */
export default async function ProductPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale: raw, slug } = await params
  const locale = toLocale(raw)
  const data = await getProductPageData(slug, locale)
  if (!data) notFound()

  // Identity facts (brand, producer, origin, unit, code) live on the Product
  // record rather than the attribute registry — they were fetched but never
  // shown. They now lead the spec sheet.
  const identityGroup = buildIdentityGroup({
    brand: data.brand?.name,
    manufacturer: data.manufacturer,
    countryOfOrigin: data.countryOfOrigin,
    applicationArea: data.applicationArea,
    unit: data.unitSymbol,
    sku: data.legacyKey,
    categoryPath: data.trail.map((t) => t.title).join(' › ') || null,
  })
  const specGroups = [...(identityGroup ? [identityGroup] : []), ...buildSpecGroups(data.attributes, data.registry)]
  const priced = data.variations.filter((v) => !v.priceOnRequest && v.price != null).map((v) => v.price as number)
  const inStock = data.variations.some((v) => v.stockStatus !== 'out_of_stock')

  const rails = await Promise.all(
    data.rails.slice(0, 3).map(async (rail) => ({
      title: rail.title,
      items: await getProductCards(rail.ids.slice(0, 8), locale),
    })),
  )

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    ...(data.legacyKey ? { sku: data.legacyKey } : {}),
    ...(data.brand ? { brand: { '@type': 'Brand', name: data.brand.name } } : {}),
    ...(data.trail.length ? { category: data.trail.map((t) => t.title).join(' > ') } : {}),
    ...(priced.length
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'MDL',
            lowPrice: Math.min(...priced),
            highPrice: Math.max(...priced),
            offerCount: data.variations.length,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  }
  const faqJsonLd =
    data.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <Breadcrumbs
        items={[
          { label: 'Acasă', href: '/' },
          ...data.trail.map((t) => ({ label: t.title, href: t.href })),
          { label: data.title },
        ]}
      />

      <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,400px)_1fr]">
        <ProductGallery images={[]} title={data.title} />
        <BuyPanel
          slug={data.slug}
          title={data.title}
          brand={data.brand?.name}
          brandHref={data.brand ? `/brand/${data.brand.slug}` : undefined}
          unit={data.unitSymbol}
          variations={data.variations}
          phone={process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null}
        />
      </div>

      {/* Specificații first and open by default — the spec sheet is what drives
          a purchase decision. Both panels are server-rendered and merely
          hidden, so Description stays crawlable (SEO requirement). */}
      <ProductTabs
        className="mt-10"
        tabs={[
          {
            id: 'specificatii',
            label: 'Specificații',
            content:
              specGroups.length > 0 ? (
                <SpecificationTable groups={specGroups} />
              ) : (
                <p className="text-sm text-faint">Specificațiile vor fi completate în curând.</p>
              ),
          },
          {
            id: 'descriere',
            label: 'Descriere',
            content: data.description ? (
              <RichTextBlock data={data.description} className="max-w-3xl" />
            ) : (
              <p className="text-sm text-faint">
                Descrierea detaliată va fi adăugată în curând. Pentru informații suplimentare, sunați-ne —
                vă răspundem imediat.
              </p>
            ),
          },
          {
            id: 'documente',
            label: 'Documente',
            disabled: true,
            disabledHint: 'Fișele tehnice — în curând',
            content: null,
          },
        ]}
      />

      {data.faqs.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-lg font-medium text-fg">Întrebări frecvente</h2>
          <div className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
            {data.faqs.map((f, i) => (
              <details key={i} className="group px-4 py-3">
                <summary className="cursor-pointer list-none text-sm text-fg marker:content-none">
                  {f.question}
                </summary>
                <p className="mt-2 text-sm text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <ProductSeoContent
        className="mt-10"
        input={{
          title: data.title,
          brand: data.brand?.name,
          manufacturer: data.manufacturer,
          countryOfOrigin: data.countryOfOrigin,
          applicationArea: data.applicationArea,
          categoryTitle: data.trail.at(-1)?.title ?? null,
          sectionTitle: data.trail[0]?.title ?? null,
          unit: data.unitSymbol,
          priceMin: priced.length > 0 ? Math.min(...priced) : null,
          variationCount: data.variations.length,
          keySpecs: specGroups
            .flatMap((g) => (g.key === 'identity' ? [] : g.rows))
            .slice(0, 3)
            .map((r) => ({ label: r.label, value: r.value })),
        }}
      />

      {rails.length > 0 && (
        <div className="mt-12 space-y-10">
          {rails.map(
            (rail) =>
              rail.items.length > 0 && (
                <RelatedProducts key={rail.title} title={rail.title} products={rail.items} />
              ),
          )}
        </div>
      )}
    </div>
  )
}

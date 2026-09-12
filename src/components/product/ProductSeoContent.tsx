import React from 'react'

import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

/**
 * Contextual product content for SEO and for buyers who want prose rather
 * than a spec table.
 *
 * Design rules, deliberately strict:
 *  - **Only real data.** Every sentence is emitted only when the fields it
 *    depends on exist. No placeholders, no "N/A", no invented claims.
 *  - **No duplicate boilerplate.** Sentence shape varies with which data is
 *    present, and a stable per-product index rotates phrasing, so two
 *    different products don't render byte-identical paragraphs.
 *  - **Server-rendered.** Plain markup with no client interactivity, so the
 *    text is always in the HTML for crawlers.
 *  - **Secondary.** Sits below the main purchase information and never
 *    competes with it.
 */

export interface ProductSeoContentInput {
  title: string
  brand?: string | null
  manufacturer?: string | null
  countryOfOrigin?: string | null
  applicationArea?: string | null
  categoryTitle?: string | null
  sectionTitle?: string | null
  unit?: string | null
  priceMin?: number | null
  variationCount: number
  /** Top specs (already filtered to real values) for the "characteristics" line. */
  keySpecs?: { label: string; value: string }[]
}

/** Deterministic small index derived from the title — same product always gets
 * the same phrasing, different products vary. */
function variantIndex(seed: string, buckets: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000
  return h % buckets
}

function buildParagraphs(input: ProductSeoContentInput): string[] {
  const v = variantIndex(input.title, 3)
  const out: string[] = []

  // 1) What it is + where it sits in the catalog.
  const place = input.categoryTitle
    ? input.sectionTitle && input.sectionTitle !== input.categoryTitle
      ? `din categoria ${input.categoryTitle} (${input.sectionTitle})`
      : `din categoria ${input.categoryTitle}`
    : null
  const maker = input.brand
    ? input.manufacturer && input.manufacturer !== input.brand
      ? `marca ${input.brand}, producător ${input.manufacturer}`
      : `marca ${input.brand}`
    : input.manufacturer
      ? `producător ${input.manufacturer}`
      : null

  const intro = [
    `${input.title} este un produs ${[place, maker].filter(Boolean).join(', ')}, disponibil în catalogul LiderConstruct.`,
    `${input.title}${place ? ` face parte ${place}` : ''}${maker ? ` și este oferit sub ${maker}` : ''}, disponibil în stocul LiderConstruct.`,
    `În catalogul LiderConstruct găsești ${input.title}${maker ? `, ${maker}` : ''}${place ? `, ${place}` : ''}.`,
  ][v]
  if (place || maker) out.push(intro)
  else out.push(`${input.title} este disponibil în catalogul LiderConstruct.`)

  // 2) Application — only when the supplier actually provided it.
  if (input.applicationArea) {
    out.push(
      [
        `Se folosește pentru: ${input.applicationArea.toLowerCase()}.`,
        `Domeniu de aplicare: ${input.applicationArea.toLowerCase()}.`,
        `Este destinat pentru ${input.applicationArea.toLowerCase()}.`,
      ][v],
    )
  }

  // 3) Key characteristics — real spec values only.
  const specs = (input.keySpecs ?? []).slice(0, 3)
  if (specs.length > 0) {
    out.push(
      `Caracteristici principale: ${specs.map((s) => `${s.label.toLowerCase()} — ${s.value}`).join('; ')}.`,
    )
  }

  // 4) Options & origin.
  const bits: string[] = []
  if (input.variationCount > 1) {
    bits.push(`Produsul este disponibil în ${input.variationCount} variante`)
  }
  if (input.countryOfOrigin) bits.push(`țara de origine ${input.countryOfOrigin}`)
  if (bits.length > 0) out.push(`${bits.join(', ')}.`)

  // 5) Commercial line — price only when a real one exists.
  if (typeof input.priceMin === 'number') {
    out.push(
      `Prețul pornește de la ${formatMoney(input.priceMin)}${input.unit ? ` / ${input.unit}` : ''}. Livrăm în Chișinău și în toată Moldova; pentru confirmarea stocului și a prețului final, adaugă produsul în comandă sau contactează-ne telefonic.`,
    )
  } else {
    out.push(
      'Prețul se confirmă la cerere. Adaugă produsul în comandă sau contactează-ne telefonic pentru disponibilitate și ofertă.',
    )
  }

  return out
}

export function ProductSeoContent({
  input,
  className,
}: {
  input: ProductSeoContentInput
  className?: string
}): React.JSX.Element | null {
  const paragraphs = buildParagraphs(input)
  // Not worth rendering a section for a single generic sentence.
  if (paragraphs.length < 2) return null

  return (
    <section className={cn('max-w-3xl', className)} aria-labelledby="despre-produs">
      <h2 id="despre-produs" className="font-display text-lg font-medium text-fg">
        Despre {input.title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  )
}

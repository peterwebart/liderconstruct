import type { Metadata } from 'next'
import React from 'react'

import {
  Breadcrumbs,
  Button,
  EmptyState,
  IconButton,
  PriceDisplay,
  Skeleton,
  StockBadge,
  Tag,
} from '@/components/ui'
import { SearchX, Trash2 } from 'lucide-react'

import { Suspense } from 'react'

import { BrandCard } from '@/components/catalog/BrandCard'
import { CategoryCard } from '@/components/catalog/CategoryCard'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductList } from '@/components/catalog/ProductList'
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips'
import { FilterSidebar } from '@/components/filters/FilterSidebar'
import { MobileFilters } from '@/components/filters/MobileFilters'
import { SortControl } from '@/components/filters/SortControl'
import { FloatingContactBar } from '@/components/layout/FloatingContactBar'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BuyPanel } from '@/components/product/BuyPanel'
import { ProductGallery } from '@/components/product/ProductGallery'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { SpecificationTable } from '@/components/product/SpecificationTable'
import { QuoteCart } from '@/components/quote/QuoteCart'
import { QuoteProvider } from '@/components/quote/QuoteProvider'
import { SmartSearch } from '@/components/search/SmartSearch'
import type { GalleryImage, ProductCardData, ProductVariationData } from '@/lib/catalog-types'
import type { SpecGroup } from '@/lib/specs'
import type { FacetsResult } from '@/services/search/types'
import type { NavBrand, NavSection, PopularTerm } from '@/lib/navigation'

import { DemoQuoteCount } from './DemoQuoteCount'

import { InteractiveDemos } from './InteractiveDemos'

export const metadata: Metadata = {
  title: 'Component gallery (dev)',
  robots: { index: false, follow: false },
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-sm font-medium tracking-wide text-muted uppercase">{title}</h2>
      <div className="rounded-card border border-border bg-surface p-5">{children}</div>
    </section>
  )
}

const demoPopular: PopularTerm[] = [
  { label: 'gips carton', query: 'gips carton' },
  { label: 'knauf', query: 'knauf' },
  { label: 'rockwool', query: 'rockwool' },
  { label: 'osb', query: 'osb' },
]
const demoBrands: NavBrand[] = [
  { id: 1, name: 'Knauf', slug: 'knauf', href: '/brand/knauf' },
  { id: 2, name: 'Rockwool', slug: 'rockwool', href: '/brand/rockwool' },
]
const demoSections: NavSection[] = [
  {
    id: 1,
    title: 'Termoizolare și fonoizolare',
    slug: 'termoizolare',
    href: '/category/termoizolare',
    icon: null,
    count: 204,
    children: [
      { id: 11, title: 'Vată minerală', slug: 'vata-minerala', href: '/category/termoizolare/vata-minerala', count: 148, featured: true },
      { id: 12, title: 'Polistiren', slug: 'polistiren', href: '/category/termoizolare/polistiren', count: 37, featured: false },
      { id: 13, title: 'Accesorii termoizolare', slug: 'accesorii', href: '/category/termoizolare/accesorii', count: 19, featured: false },
    ],
  },
  {
    id: 2,
    title: 'Gips-carton și sisteme interioare',
    slug: 'gips-carton',
    href: '/category/gips-carton',
    icon: null,
    count: 318,
    children: [
      { id: 21, title: 'Plăci de gips-carton', slug: 'placi', href: '/category/gips-carton/placi', count: 96, featured: false },
      { id: 22, title: 'Profile pentru gips-carton', slug: 'profile', href: '/category/gips-carton/profile', count: 132, featured: true },
      { id: 23, title: 'Plăci și panouri', slug: 'panouri', href: '/category/gips-carton/panouri', count: 90, featured: false },
    ],
  },
  {
    id: 3,
    title: 'Uși și ferestre',
    slug: 'usi-si-ferestre',
    href: '/category/usi-si-ferestre',
    icon: null,
    count: 742,
    children: [
      { id: 31, title: 'Uși de interior', slug: 'usi-de-interior', href: '/category/usi-si-ferestre/usi-de-interior', count: 525, featured: true },
      { id: 32, title: 'Uși metalice', slug: 'usi-metalice', href: '/category/usi-si-ferestre/usi-metalice', count: 95, featured: false },
      { id: 33, title: 'Feronerie pentru uși', slug: 'feronerie', href: '/category/usi-si-ferestre/feronerie', count: 122, featured: false },
    ],
  },
]

const demoProducts: ProductCardData[] = [
  {
    id: 'p1', slug: 'vata-minerala-rockwool-roofrock-100', title: 'Vată minerală Rockwool Roofrock 100mm',
    brand: 'Rockwool', sku: 'LC-12345', priceMin: 142.2, priceOnRequest: false,
    stockStatus: 'in_stock', unit: 'm²', imageUrl: null, variationCount: 1,
    defaultVariationSku: 'LC-12345', defaultVariationLabel: '100mm',
  },
  {
    id: 'p2', slug: 'usa-interior-mira-nuc', title: 'Ușă de interior Mira, nuc clasic',
    brand: 'Novii Stili', sku: 'LC-43122', priceMin: 3450, priceOnRequest: false,
    stockStatus: 'low_stock', unit: 'buc', imageUrl: null, variationCount: 4,
    defaultVariationSku: null, defaultVariationLabel: null,
  },
  {
    id: 'p3', slug: 'multirock-rulou', title: 'Rockwool Multirock rulou',
    brand: 'Rockwool', sku: 'LC-12361', priceMin: null, priceOnRequest: true,
    stockStatus: 'in_stock', unit: null, imageUrl: null, variationCount: 1,
    defaultVariationSku: 'LC-12361', defaultVariationLabel: null,
  },
  {
    id: 'p4', slug: 'glet-supraten-eurofin', title: 'Glet Supraten Eurofin SV+ pentru finisare',
    brand: 'Supraten', sku: 'LC-15463', priceMin: 209, priceOnRequest: false,
    stockStatus: 'out_of_stock', unit: 'sac', imageUrl: null, variationCount: 1,
    defaultVariationSku: 'LC-15463', defaultVariationLabel: '20 kg',
  },
]

const demoFacets: FacetsResult = {
  facets: [
    {
      key: '_brand',
      label: 'Brand',
      values: [
        { value: 'rockwool', label: 'Rockwool', count: 86 },
        { value: 'isover', label: 'Isover', count: 54 },
        { value: 'knauf', label: 'Knauf', count: 41 },
        { value: 'supraten', label: 'Supraten', count: 23 },
        { value: 'ceresit', label: 'Ceresit', count: 18 },
        { value: 'tehnonikoli', label: 'Tehnonikoli', count: 12 },
        { value: 'ursa', label: 'Ursa', count: 7 },
      ],
    },
    {
      key: 'grosime-foaie-usa',
      label: 'Grosime',
      values: [
        { value: '50mm', count: 34 },
        { value: '100mm', count: 61 },
        { value: '150mm', count: 28 },
        { value: '200mm', count: 9 },
      ],
    },
    {
      key: 'tip-material',
      label: 'Tip material',
      values: [
        { value: 'Vată bazaltică', count: 74 },
        { value: 'Vată de sticlă', count: 43 },
        { value: 'Polistiren expandat', count: 21 },
      ],
    },
  ],
  priceRange: { min: 80, max: 220 },
  stockCounts: { inStock: 132, total: 148 },
}

const svgImage = (shade: string, label: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="${shade}"/><rect x="60" y="60" width="680" height="680" fill="none" stroke="#262D38" stroke-width="2"/><text x="400" y="415" font-family="monospace" font-size="30" fill="#6B7480" text-anchor="middle">${label}</text></svg>`,
  )}`

const demoImages: GalleryImage[] = [
  { url: svgImage('#1E2A3A', 'Vedere frontală'), alt: 'Ușă Mira — vedere frontală' },
  { url: svgImage('#1B212A', 'Detaliu toc'), alt: 'Ușă Mira — detaliu toc' },
  { url: svgImage('#14181E', 'Secțiune'), alt: 'Ușă Mira — secțiune' },
]

const demoVariations: ProductVariationData[] = [
  { sku: 'LC-43122/1', price: 3450, priceOnRequest: false, stockStatus: 'in_stock', label: '600×2000', attributes: [{ type: 'door_dimensions', value: '600×2000' }] },
  { sku: 'LC-43122/2', price: 3450, priceOnRequest: false, stockStatus: 'in_stock', label: '700×2000', attributes: [{ type: 'door_dimensions', value: '700×2000' }] },
  { sku: 'LC-43122/3', price: 3620, priceOnRequest: false, stockStatus: 'low_stock', label: '800×2000', attributes: [{ type: 'door_dimensions', value: '800×2000' }] },
  { sku: 'LC-43122/4', price: 3620, priceOnRequest: false, stockStatus: 'out_of_stock', label: '900×2000', attributes: [{ type: 'door_dimensions', value: '900×2000' }] },
]

const demoSpecGroups: SpecGroup[] = [
  {
    key: 'dimensions',
    label: 'Dimensiuni',
    rows: [
      { label: 'Grosime foaie ușă (mm)', value: '40 mm', mono: true },
      { label: 'Înălțime foaie ușă (mm)', value: '2000 mm', mono: true },
      { label: 'Grosime cutie ușă (mm)', value: '75 mm', mono: true },
    ],
  },
  {
    key: 'technical',
    label: 'Tehnic',
    rows: [
      { label: 'Construcție ușă', value: 'Celulară', mono: false },
      { label: 'Tip deschidere', value: 'Batantă', mono: false },
      { label: 'Setul de ușă include', value: 'Foaie + cutie', mono: false },
      { label: 'Culoare', value: 'Nuc clasic', mono: false },
    ],
  },
  {
    key: 'performance',
    label: 'Performanță',
    rows: [{ label: 'Umplutura ușă', value: 'Fagure celular', mono: false }],
  },
]

/** Dev-only workbench: every primitive in its states, on the real tokens. */
export default function ComponentGalleryPage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Component gallery</h1>
        <p className="mt-1 text-sm text-muted">
          Primitives on the production design tokens. Not linked, not indexed.
        </p>
        <div className="tick-rule mt-5" aria-hidden />
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Adaugă în comandă</Button>
          <Button variant="secondary">Compară</Button>
          <Button variant="ghost">Șterge filtrele</Button>
          <Button variant="danger">Anulează</Button>
          <Button disabled>Indisponibil</Button>
          <Button size="sm">Mic</Button>
          <Button size="lg">Mare</Button>
          <IconButton label="Șterge" variant="secondary">
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </Section>

      <Section title="Interactive (client)">
        <InteractiveDemos />
      </Section>

      <Section title="Header + Mega menu (demo taxonomy — live data after import)">
        <div className="-m-5 overflow-visible">
          <Header sections={demoSections} featuredBrands={demoBrands} popular={demoPopular} phone="+373 22 000 000" className="static" />
          <p className="px-5 py-3 text-xs text-faint">
            Deschide „Produse”: ↓/↑ secțiuni, → categorii, ← înapoi, esc închide. Pe mobil — meniul burger cu acordeon și căutarea fixată sub header.
          </p>
        </div>
      </Section>

      <Section title="Smart search — the centerpiece">
        <div className="max-w-xl">
          <SmartSearch
            size="lg"
            popular={[
              { label: 'gips carton', query: 'gips carton' },
              { label: 'knauf', query: 'knauf' },
              { label: 'rockwool', query: 'rockwool' },
              { label: 'osb', query: 'osb' },
              { label: 'laminat', query: 'laminat' },
            ]}
          />
          <p className="mt-2 text-xs text-faint">
            Live against /api/search/suggest — tastează „usa” (fără diacritice) după import ca să vezi
            potrivirea pe „ușă”. ↑↓ navighează, ↵ deschide, esc închide.
          </p>
        </div>
      </Section>

      <QuoteProvider>
        <Section title="Product cards + grid (quick add is live — multi-variation links to the product)">
          <div className="space-y-3">
            <DemoQuoteCount />
            <ProductGrid products={demoProducts} className="xl:grid-cols-4" />
          </div>
        </Section>

        <Section title="Product list (dense rows)">
          <ProductList products={demoProducts} />
        </Section>

        <Section title="Product page — gallery + buy panel (variation picker; OOS rămâne selectabil)">
          <div className="grid gap-6 md:grid-cols-[minmax(0,380px)_1fr]">
            <ProductGallery images={demoImages} title="Ușă de interior Mira, nuc clasic" />
            <BuyPanel
              slug="usa-interior-mira-nuc"
              title="Ușă de interior Mira, nuc clasic"
              brand="Novii Stili"
              brandHref="/brand/novii-stili"
              unit="buc"
              variations={demoVariations}
              phone="+373 22 000 000"
              heading="h2"
            />
          </div>
        </Section>

        <Section title="Quote cart — flow F (sertar → formular → comandă)">
          <div className="flex items-center gap-4">
            <QuoteCart />
            <p className="text-xs text-faint">
              Adaugă produse mai sus, apoi deschide sertarul: editează cantitățile, „Trimite comanda”
              deschide formularul (nume, telefon, localitate + honeypot). Trimiterea creează o comandă
              reală prin server action — fără DATABASE_URI formularul afișează eroarea de server.
            </p>
          </div>
        </Section>

        <Section title="Floating contact bar (mobil — Sună + Comandă, se ascunde la derulare)">
          <FloatingContactBar phone="+373 22 000 000" fixed={false} className="md:block" />
          <p className="mt-2 text-xs text-faint">
            Pe site: fixată jos doar pe mobil, dispare la derulare în jos și revine la derulare în sus;
            respectă safe-area. Butonul „Comandă” deschide același sertar al comenzii.
          </p>
        </Section>

        <Section title="Related products rail">
          <RelatedProducts title="Accesorii recomandate" products={demoProducts} href="/category/usi-si-ferestre/feronerie" />
        </Section>
      </QuoteProvider>

      <Section title="Gallery — empty state (catalog ships image-less)">
        <div className="max-w-[220px]">
          <ProductGallery images={[]} title="Produs fără imagine" />
        </div>
      </Section>

      <Section title="Specification table — registry-grouped, mono values">
        <SpecificationTable groups={demoSpecGroups} />
      </Section>

      <Section title="Footer — secțiuni + branduri din taxonomie, nimic hardcodat">
        <div className="-m-5">
          <Footer
            sections={demoSections}
            featuredBrands={demoBrands}
            phone="+373 22 000 000"
            email="info@liderconstruct.md"
          />
        </div>
      </Section>

      <Section title="Grid loading state">
        <ProductGrid products={[]} loading skeletonCount={4} className="xl:grid-cols-4" />
      </Section>

      <Section title="Category + brand cards">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CategoryCard title="Gips-carton" href="/category/gips-carton" count={318} icon="Layers" />
          <CategoryCard title="Termoizolare" href="/category/termoizolare" count={204} icon="ThermometerSnowflake" />
          <CategoryCard title="Uși și ferestre" href="/category/usi-si-ferestre" count={742} icon="DoorOpen" />
          <CategoryCard title="Vopsele și finisaje" href="/category/vopsele" count={396} icon="PaintRoller" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <BrandCard name="Knauf" href="/brand/knauf" count={121} />
          <BrandCard name="Rockwool" href="/brand/rockwool" count={86} />
          <BrandCard name="Ceresit" href="/brand/ceresit" count={64} />
          <BrandCard name="Supraten" href="/brand/supraten" count={121} />
        </div>
      </Section>

      <Section title="Filters — registry-driven facets (URL state; try the chips and sort)">
        <Suspense fallback={null}>
          <div className="grid gap-5 md:grid-cols-[210px_1fr]">
            <FilterSidebar data={demoFacets} className="hidden md:block" />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MobileFilters data={demoFacets} triggerClassName="md:inline-flex" />
                <SortControl />
              </div>
              <ActiveFilterChips data={demoFacets} />
              <p className="text-xs text-faint">
                Selecțiile trăiesc în URL (partajabile, compatibile cu butonul înapoi). Pe mobil filtrele
                se aplică din foaia de jos, cu numărul selecțiilor pe buton.
              </p>
            </div>
          </div>
        </Suspense>
      </Section>

      <Section title="Price display — never 0,00 lei">
        <div className="flex flex-wrap items-center gap-6">
          <PriceDisplay amount={3450} size="lg" perUnit="buc" />
          <PriceDisplay amount={142.2} perUnit="m²" />
          <PriceDisplay amount={98.5} size="sm" />
          <PriceDisplay onRequest size="md" />
          <PriceDisplay amount={0} />
        </div>
      </Section>

      <Section title="Stock badges">
        <div className="flex flex-wrap items-center gap-6">
          <StockBadge status="in_stock" />
          <StockBadge status="low_stock" />
          <StockBadge status="out_of_stock" />
        </div>
      </Section>

      <Section title="Tags — spec values in mono">
        <div className="flex flex-wrap items-center gap-2">
          <Tag spec>LC-43122/2</Tag>
          <Tag spec active>700×2000</Tag>
          <Tag spec>100mm</Tag>
          <Tag>Rockwool</Tag>
          <Tag active>Vată minerală</Tag>
        </div>
      </Section>

      <Section title="Breadcrumbs (+ JSON-LD)">
        <Breadcrumbs
          items={[
            { label: 'Acasă', href: '/' },
            { label: 'Uși și ferestre', href: '/category/usi-si-ferestre' },
            { label: 'Uși de interior' },
          ]}
        />
      </Section>

      <Section title="Skeletons">
        <div className="grid max-w-sm gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<SearchX className="size-8" />}
          title="Niciun rezultat pentru «rockwol 100»"
          hint="Încearcă un alt termen sau cere produsul direct — îl găsim noi."
          action={<Button variant="secondary">Cere ofertă</Button>}
        />
      </Section>
    </main>
  )
}

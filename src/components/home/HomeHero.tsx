'use client'

import { icons, LayoutGrid, Play, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import type { NavSection, PopularTerm, TopBrand } from '@/lib/navigation'

/**
 * Homepage hero — the "first screen" (matches the approved design):
 * construction banner behind the "BUILD MORE. WORRY LESS." headline, the
 * 3-simple-steps finder (category tiles then search), a WATCH VIDEO
 * affordance, the TOP BRANDS side panel, and a stats strip. Data is
 * CMS/taxonomy-driven.
 */
export function HomeHero({
  sections,
  brands,
  popular,
  stats,
}: {
  sections: NavSection[]
  brands: TopBrand[]
  popular: PopularTerm[]
  stats: { products: number; brands: number }
}): React.JSX.Element {
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const tiles = useMemo(() => sections.slice(0, 8), [sections])

  const submitSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    const q = term.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const productsLabel = stats.products > 0 ? `${formatCount(stats.products)}+` : '35,000+'
  const brandsLabel = stats.brands > 0 ? `${formatCount(stats.brands)}+` : '500+'

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-construction.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 pb-8 pt-8 md:px-6 lg:grid-cols-[1fr_290px] lg:pb-12 lg:pt-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight text-fg md:text-6xl lg:text-7xl">
            Construiește mai mult.
            <br />
            <span className="text-accent">Cu griji mai puține.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted md:text-lg">
            Tot ce ai nevoie pentru proiectele tale de construcție. Mii de produse, branduri de top,
            prețuri avantajoase.
          </p>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-fg">
              Găsește produse în <span className="text-accent">3 pași simpli</span>
            </p>

            <ol className="mt-3 flex flex-wrap gap-2" aria-label="Pași de căutare">
              <FinderStep n={1} label="Alege categoria" active />
              <FinderStep n={2} label="Alege brandul" />
              <FinderStep n={3} label="Găsește produsul" />
            </ol>

            {tiles.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {tiles.map((s) => (
                  <CategoryTile
                    key={s.id}
                    title={s.title}
                    icon={s.icon}
                    href={s.href}
                    active={activeSection === s.id}
                    onMouseEnter={() => setActiveSection(s.id)}
                  />
                ))}
                <Link
                  href="/search"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-card border border-border bg-surface/70 p-2.5 text-center transition-colors hover:border-accent"
                >
                  <LayoutGrid className="size-5 text-faint" aria-hidden />
                  <span className="text-[11px] leading-tight text-muted">Vezi tot</span>
                </Link>
              </div>
            )}

            <form
              onSubmit={submitSearch}
              className="mt-3 flex overflow-hidden rounded-control border border-border bg-surface shadow-lg"
            >
              <span className="flex items-center pl-3 text-faint">
                <Search className="size-4" aria-hidden />
              </span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Caută după nume, SKU, brand sau cuvânt cheie…"
                aria-label="Caută în catalog"
                className="h-12 w-full bg-transparent px-3 text-sm text-fg outline-none placeholder:text-faint"
              />
              <button
                type="submit"
                className="flex h-12 shrink-0 items-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-600 sm:px-6"
              >
                <Search className="size-4" aria-hidden />
                <span className="hidden sm:inline">Caută</span>
              </button>
            </form>

            {popular.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-faint">Căutări populare:</span>
                {popular.slice(0, 7).map((p) => (
                  <Link
                    key={p.query}
                    href={`/search?q=${encodeURIComponent(p.query)}`}
                    className="rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden flex-col gap-4 lg:flex">
          {brands.length > 0 && (
            <aside className="self-start rounded-card border border-border bg-surface/85 backdrop-blur">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-fg">Branduri de top</span>
                <Link href="/brands" className="text-xs text-accent hover:underline">
                  Vezi toate
                </Link>
              </div>
              <ul>
                {brands.slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link
                      href={b.href}
                      className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 text-sm text-muted transition-colors last:border-0 hover:bg-surface-2 hover:text-fg"
                    >
                      <span className="font-medium tracking-wide">{b.name.toUpperCase()}</span>
                      <span className="font-mono text-[11px] text-faint">{formatCount(b.count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-3">
                <Link
                  href="/brands"
                  className="block rounded-control border border-border py-2 text-center text-xs font-medium text-fg transition-colors hover:border-accent"
                >
                  Vezi toate brandurile
                </Link>
              </div>
            </aside>
          )}

          <Link href="/despre" className="group flex items-center gap-3 self-start rounded-card px-1 py-1 text-left">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform group-hover:scale-105">
              <Play className="size-5 translate-x-0.5 fill-current" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-fg">Vezi videoclipul</span>
              <span className="block text-xs text-muted">Vezi cum susținem proiectele tale</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="border-y border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-4 px-4 py-5 md:grid-cols-3 md:px-6 lg:grid-cols-6">
          <Stat value="25+" label="Ani de experiență" />
          <Stat value={brandsLabel} label="Producători de încredere" />
          <Stat value={productsLabel} label="Produse de calitate" />
          <Stat value="Rapid" label="Livrare în toată Moldova" />
          <Stat value="Expert" label="Suport tehnic" />
          <Stat value="Avantajos" label="Prețuri în fiecare zi" />
        </div>
      </div>
    </section>
  )
}

function FinderStep({ n, label, active }: { n: number; label: string; active?: boolean }): React.JSX.Element {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-control border px-3 py-1.5 text-xs',
        active ? 'border-accent bg-surface text-fg' : 'border-border bg-surface/60 text-muted',
      )}
    >
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold',
          active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-faint',
        )}
      >
        {n}
      </span>
      {label}
    </li>
  )
}

function CategoryTile({
  title,
  icon,
  href,
  active,
  onMouseEnter,
}: {
  title: string
  icon: string | null
  href: string
  active?: boolean
  onMouseEnter?: () => void
}): React.JSX.Element {
  const Icon = (icon && icons[icon as keyof typeof icons]) || LayoutGrid
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-card border p-2.5 text-center transition-colors',
        active ? 'border-accent bg-surface' : 'border-border bg-surface/70 hover:border-accent',
      )}
    >
      <Icon className={cn('size-5', active ? 'text-accent' : 'text-muted')} aria-hidden />
      <span className="line-clamp-2 text-[11px] leading-tight text-muted">{title}</span>
    </Link>
  )
}

function Stat({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className="flex flex-col">
      <span className="font-display text-xl font-bold text-fg md:text-2xl">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-faint">{label}</span>
    </div>
  )
}

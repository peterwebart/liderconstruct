'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import type { ApplicationTerm, NavBrand, NavSection, PopularTerm } from '@/lib/navigation'

type Axis = 'category' | 'brand' | 'application'

const selectClass =
  'h-11 w-full appearance-none rounded-control border border-border bg-surface-2 px-3 text-sm text-fg outline-none transition-colors focus:border-accent disabled:opacity-50'

/**
 * The Finder — the homepage's signature discovery module (spec §5.1):
 * three axes (Categorie / Brand / Aplicație), two clicks to a product list.
 * Options come from the taxonomy, brands, and live application values.
 */
export function Finder({
  sections,
  brands,
  applications,
  popular = [],
  className,
}: {
  sections: NavSection[]
  brands: NavBrand[]
  applications: ApplicationTerm[]
  popular?: PopularTerm[]
  className?: string
}): React.JSX.Element {
  const router = useRouter()
  const [axis, setAxis] = useState<Axis>('category')
  const [sectionSlug, setSectionSlug] = useState('')
  const [categoryHref, setCategoryHref] = useState('')
  const [brandSlug, setBrandSlug] = useState('')
  const [application, setApplication] = useState('')

  const section = useMemo(() => sections.find((s) => s.slug === sectionSlug), [sections, sectionSlug])

  const target =
    axis === 'category'
      ? categoryHref || (section ? section.href : '')
      : axis === 'brand'
        ? brandSlug && `/brand/${brandSlug}`
        : application && `/search?q=${encodeURIComponent(application)}`

  const go = (e: React.FormEvent): void => {
    e.preventDefault()
    if (target) router.push(target)
  }

  const tabs: { key: Axis; label: string }[] = [
    { key: 'category', label: 'Pe categorie' },
    { key: 'brand', label: 'Pe brand' },
    { key: 'application', label: 'Pe aplicație' },
  ]

  return (
    <div className={cn('rounded-card border border-border bg-surface p-4 md:p-5', className)}>
      <div className="flex gap-1 border-b border-border pb-3" role="tablist" aria-label="Mod de căutare">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={axis === t.key}
            onClick={() => setAxis(t.key)}
            className={cn(
              'rounded-control px-3 py-1.5 text-sm transition-colors',
              axis === t.key ? 'bg-accent font-medium text-accent-fg' : 'text-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={go} className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        {axis === 'category' && (
          <>
            <select
              aria-label="Secțiune"
              className={cn(selectClass, 'sm:flex-1')}
              value={sectionSlug}
              onChange={(e) => {
                setSectionSlug(e.target.value)
                setCategoryHref('')
              }}
            >
              <option value="">Alege secțiunea…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Categorie"
              className={cn(selectClass, 'sm:flex-1')}
              value={categoryHref}
              onChange={(e) => setCategoryHref(e.target.value)}
              disabled={!section}
            >
              <option value="">{section ? `Toată secțiunea (${section.title})` : 'Alege categoria…'}</option>
              {(section?.children ?? []).map((c) => (
                <option key={c.id} value={c.href}>
                  {c.title}
                </option>
              ))}
            </select>
          </>
        )}

        {axis === 'brand' && (
          <select
            aria-label="Brand"
            className={cn(selectClass, 'sm:flex-1')}
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
          >
            <option value="">Alege brandul…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {axis === 'application' && (
          <select
            aria-label="Aplicație"
            className={cn(selectClass, 'sm:flex-1')}
            value={application}
            onChange={(e) => setApplication(e.target.value)}
          >
            <option value="">Alege aplicația…</option>
            {applications.map((a) => (
              <option key={a.label} value={a.label}>
                {a.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={!target}
          className="flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-600 disabled:opacity-50"
        >
          Caută
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>

      {popular.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-faint">Căutări populare:</span>
          {popular.slice(0, 6).map((p) => (
            <Link
              key={p.query}
              href={`/search?q=${encodeURIComponent(p.query)}`}
              className="rounded-control border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {p.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

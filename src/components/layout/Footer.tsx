import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/cn'
import type { NavBrand, NavSection } from '@/lib/navigation'

/**
 * Site footer (spec §5.1): sections + brands come from the taxonomy/CMS via
 * the navigation layer — nothing hardcoded. Contact data arrives from env
 * until a ContactSettings global exists.
 */
export function Footer({
  sections,
  featuredBrands = [],
  phone,
  email,
  className,
}: {
  sections: NavSection[]
  featuredBrands?: NavBrand[]
  phone?: string | null
  email?: string | null
  className?: string
}): React.JSX.Element {
  const year = new Date().getFullYear()
  return (
    <footer className={cn('border-t border-border bg-surface', className)}>
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <div className="tick-rule mt-6" aria-hidden />
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="font-display text-base font-bold tracking-wide text-fg">
              LIDER<span className="text-accent">CONSTRUCT</span>
            </p>
            <p className="text-sm text-muted">
              Materiale de construcție pentru profesioniști și proiecte de casă — mii de produse, branduri
              verificate, livrare în toată Moldova.
            </p>
            <div className="space-y-1 text-sm">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="block font-mono text-muted transition-colors hover:text-fg"
                >
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="block text-muted transition-colors hover:text-fg">
                  {email}
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Secțiuni">
            <h3 className="text-[11px] uppercase tracking-widest text-faint">Secțiuni</h3>
            <ul className="mt-3 space-y-1.5">
              {sections.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <Link href={s.href} className="text-sm text-muted transition-colors hover:text-fg">
                    {s.title}
                  </Link>
                </li>
              ))}
              {sections.length === 0 && <li className="text-sm text-faint">Se încarcă după import.</li>}
            </ul>
          </nav>

          <nav aria-label="Branduri">
            <h3 className="text-[11px] uppercase tracking-widest text-faint">Branduri de top</h3>
            <ul className="mt-3 space-y-1.5">
              {featuredBrands.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link href={b.href} className="text-sm text-muted transition-colors hover:text-fg">
                    {b.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/brands" className="text-sm text-accent hover:underline">
                  Toate brandurile →
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Informații">
            <h3 className="text-[11px] uppercase tracking-widest text-faint">Informații</h3>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link href="/despre" className="text-sm text-muted transition-colors hover:text-fg">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="/livrare" className="text-sm text-muted transition-colors hover:text-fg">
                  Livrare și plată
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted transition-colors hover:text-fg">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-4 text-xs text-faint">
          <span>© {year} LiderConstruct — materiale de construcție, Moldova</span>
          <span>
            RO ·{' '}
            <span title="Versiunea rusă — în curând" className="cursor-not-allowed">
              RU în curând
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}

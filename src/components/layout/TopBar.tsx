import { Award, Headphones, Package, Truck } from 'lucide-react'
import React from 'react'

/**
 * Utility strip above the header (matches the design): trust signals in a thin
 * bar. Hidden on small screens where it would wrap awkwardly.
 */
export function TopBar(): React.JSX.Element {
  const items = [
    { icon: Award, label: 'Alegerea profesioniștilor în materiale de construcție', strong: true },
    { icon: Package, label: '500+ branduri' },
    { icon: Package, label: '35.000+ produse' },
    { icon: Truck, label: 'Livrare rapidă în toată Moldova' },
    { icon: Headphones, label: 'Suport de specialitate' },
  ]
  return (
    <div className="hidden border-b border-border bg-bg lg:block">
      <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-6 py-2 text-[11px] uppercase tracking-wide text-faint">
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <span
              key={i}
              className={`flex items-center gap-1.5 ${it.strong ? 'font-semibold text-muted' : ''} ${i === 0 ? 'mr-auto' : ''}`}
            >
              <Icon className="size-3.5 text-accent" aria-hidden />
              {it.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

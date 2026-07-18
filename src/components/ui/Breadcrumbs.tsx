import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/cn'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://liderconstruct.md'

export interface Crumb {
  label: string
  href?: string
}

/** Location trail + schema.org BreadcrumbList (spec §5.4/§5.5). */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[]
  className?: string
}): React.JSX.Element {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SERVER_URL}${item.href}` } : {}),
    })),
  }
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-faint', className)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-muted">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(last && 'text-muted')} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden>›</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

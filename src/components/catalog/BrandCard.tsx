import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'

/** Brand tile — logo when available, name monogram until enrichment. */
export function BrandCard({
  name,
  href,
  logoUrl,
  count,
  className,
}: {
  name: string
  href: string
  logoUrl?: string | null
  count?: number
  className?: string
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-16 items-center justify-center gap-2 rounded-card border border-border bg-surface px-3 transition-all duration-150',
        'hover:border-faint motion-safe:hover:-translate-y-0.5',
        className,
      )}
      title={typeof count === 'number' ? `${name} — ${formatCount(count)} produse` : name}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={name} width={96} height={32} className="max-h-8 w-auto object-contain" />
      ) : (
        <span className="text-sm font-medium tracking-wide text-muted transition-colors group-hover:text-fg">
          {name.toUpperCase()}
        </span>
      )}
    </Link>
  )
}

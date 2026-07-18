import { icons, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'

/**
 * Category tile (homepage sections grid / mega menu). Icon name comes from the
 * CMS taxonomy `icon` field (lucide name) — nothing hardcoded; unknown or
 * missing names fall back to a neutral glyph.
 */
export function CategoryCard({
  title,
  href,
  count,
  icon,
  size = 'md',
  className,
}: {
  title: string
  href: string
  count?: number
  icon?: string | null
  size?: 'sm' | 'md'
  className?: string
}): React.JSX.Element {
  const Icon = (icon && icons[icon as keyof typeof icons]) || LayoutGrid
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-1.5 rounded-card border border-border bg-surface transition-all duration-150',
        'hover:border-faint motion-safe:hover:-translate-y-0.5',
        size === 'sm' ? 'p-3' : 'p-4',
        className,
      )}
    >
      <Icon className="size-5 text-accent" aria-hidden />
      <span className={cn('text-fg', size === 'sm' ? 'text-xs' : 'text-sm')}>{title}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="font-mono text-[11px] text-faint">{formatCount(count)}</span>
      )}
    </Link>
  )
}

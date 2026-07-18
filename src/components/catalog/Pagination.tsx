import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/cn'
import { searchParamsToURLSearchParams } from '@/lib/filter-params'

function pageHref(
  path: string,
  sp: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = searchParamsToURLSearchParams(sp)
  if (page <= 1) params.delete('page')
  else params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Windowed page list: 1 … p-1 [p] p+1 … last. Preserves all filters. */
function windowPages(page: number, pageCount: number): (number | 'gap')[] {
  const set = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const pages = [...set].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  let prev = 0
  for (const n of pages) {
    if (n - prev > 1) out.push('gap')
    out.push(n)
    prev = n
  }
  return out
}

export function Pagination({
  page,
  pageCount,
  path,
  searchParams,
  className,
}: {
  page: number
  pageCount: number
  path: string
  searchParams: Record<string, string | string[] | undefined>
  className?: string
}): React.JSX.Element | null {
  if (pageCount <= 1) return null
  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Paginare">
      {page > 1 && (
        <Link
          href={pageHref(path, searchParams, page - 1)}
          aria-label="Pagina anterioară"
          className="flex size-8 items-center justify-center rounded-control border border-border text-muted transition-colors hover:border-faint hover:text-fg"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}
      {windowPages(page, pageCount).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 font-mono text-xs text-faint">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(path, searchParams, item)}
            aria-label={`Pagina ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-control border px-2 font-mono text-xs transition-colors',
              item === page
                ? 'border-accent bg-accent font-medium text-accent-fg'
                : 'border-border text-muted hover:border-faint hover:text-fg',
            )}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link
          href={pageHref(path, searchParams, page + 1)}
          aria-label="Pagina următoare"
          className="flex size-8 items-center justify-center rounded-control border border-border text-muted transition-colors hover:border-faint hover:text-fg"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  )
}

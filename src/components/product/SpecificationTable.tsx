import React from 'react'

import { cn } from '@/lib/cn'
import type { SpecGroup } from '@/lib/specs'

/**
 * Registry-grouped specification sheet (spec §5.5, ADR-0004). Groups flow in
 * two columns on desktop; measured values render in mono.
 */
export function SpecificationTable({
  groups,
  className,
}: {
  groups: SpecGroup[]
  className?: string
}): React.JSX.Element | null {
  if (groups.length === 0) return null
  return (
    <div className={cn('md:columns-2 md:gap-x-10', className)}>
      {groups.map((group) => (
        <section key={group.key} className="mb-6 break-inside-avoid">
          <h4 className="text-[10px] font-medium uppercase tracking-widest text-accent">{group.label}</h4>
          <dl className="mt-1.5">
            {group.rows.map((row, i) => (
              <div
                key={`${group.key}-${i}`}
                className="flex items-baseline justify-between gap-4 border-b border-surface-2 py-1.5"
              >
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className={cn('text-right text-sm text-fg', row.mono && 'font-mono')}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

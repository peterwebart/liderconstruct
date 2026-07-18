'use client'

import React, { useState } from 'react'

import { cn } from '@/lib/cn'

export interface ProductTab {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
  disabledHint?: string
}

/** Product content tabs (spec §5.5). Server renders the panes; this only
 * switches visibility, so all content ships in the HTML for SEO. */
export function ProductTabs({ tabs, className }: { tabs: ProductTab[]; className?: string }): React.JSX.Element {
  const enabled = tabs.filter((t) => !t.disabled)
  const [active, setActive] = useState(enabled[0]?.id ?? tabs[0]?.id)

  return (
    <div className={className}>
      <div role="tablist" aria-label="Detalii produs" className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`tab-${t.id}`}
            disabled={t.disabled}
            title={t.disabled ? t.disabledHint : undefined}
            onClick={() => setActive(t.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
              active === t.id
                ? 'border-accent text-fg'
                : 'border-transparent text-muted hover:text-fg',
              t.disabled && 'cursor-not-allowed opacity-50 hover:text-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`tab-${t.id}`}
          role="tabpanel"
          hidden={active !== t.id}
          className="pt-4"
        >
          {t.content}
        </div>
      ))}
    </div>
  )
}

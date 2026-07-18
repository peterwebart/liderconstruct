import { RichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import { cn } from '@/lib/cn'

/** Lexical rich text with the site's reading styles. */
export function RichTextBlock({
  data,
  className,
}: {
  data: unknown
  className?: string
}): React.JSX.Element | null {
  if (!data || typeof data !== 'object') return null
  return (
    <div
      className={cn(
        'space-y-3 text-sm leading-relaxed text-muted',
        '[&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline',
        '[&_strong]:font-medium [&_strong]:text-fg [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-fg',
        '[&_h3]:font-display [&_h3]:text-base [&_h3]:text-fg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        className,
      )}
    >
      <RichText data={data as React.ComponentProps<typeof RichText>['data']} />
    </div>
  )
}

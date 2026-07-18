'use client'

import { Phone } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { QuoteCart } from '@/components/quote/QuoteCart'
import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * Mobile-only quick actions (spec §5.6): call + open the inquiry cart.
 * Hides on scroll-down and returns on scroll-up (motion-safe); respects the
 * device safe area. `fixed={false}` renders inline for the gallery review.
 */
export function FloatingContactBar({
  phone,
  locale = 'ro',
  fixed = true,
  className,
}: {
  phone?: string | null
  locale?: 'ro' | 'ru'
  fixed?: boolean
  className?: string
}): React.JSX.Element {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!fixed) return
    let lastY = window.scrollY
    const onScroll = (): void => {
      const y = window.scrollY
      setHidden(y > lastY && y > 80)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [fixed])

  return (
    <div
      className={cn(
        'z-40 border-t border-border bg-surface/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden',
        fixed && 'fixed inset-x-0 bottom-0 motion-safe:transition-transform motion-safe:duration-200',
        fixed && hidden && 'translate-y-full',
        className,
      )}
    >
      <div className="flex gap-2">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className={buttonVariants({ variant: 'secondary', className: 'h-11 flex-1' })}
          >
            <Phone className="size-4 text-accent" aria-hidden />
            Sună
          </a>
        )}
        <QuoteCart variant="bar" locale={locale} className="flex-1" />
      </div>
    </div>
  )
}

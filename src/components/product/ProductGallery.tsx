'use client'

import { ChevronLeft, ChevronRight, Package, X, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import type { GalleryImage } from '@/lib/catalog-types'

/**
 * Product gallery (spec §5.5): main image + snap thumbnails + lightbox with
 * ←/→/Esc. The catalog ships image-less, so the blueprint placeholder is a
 * first-class state, not an error.
 */
export function ProductGallery({
  images,
  title,
  className,
}: {
  images: GalleryImage[]
  title: string
  className?: string
}): React.JSX.Element {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const count = images.length

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return
      setActive((i) => (i + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (!lightbox) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setLightbox(false)
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [lightbox, step])

  if (count === 0) {
    return (
      <div
        className={cn(
          'flex aspect-square items-center justify-center rounded-card border border-border bg-blueprint',
          className,
        )}
        role="img"
        aria-label={`${title} — fără imagine`}
      >
        <Package className="size-10 text-border" aria-hidden />
      </div>
    )
  }

  const current = images[active]
  const unoptimized = current.url.startsWith('data:')

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative block aspect-square w-full overflow-hidden rounded-card border border-border bg-blueprint"
        aria-label={`Mărește imaginea: ${current.alt ?? title}`}
      >
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          unoptimized={unoptimized}
          className="object-contain transition-transform duration-200 motion-safe:group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-2 right-2 rounded-control border border-border bg-surface/90 p-1.5 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="size-4" aria-hidden />
        </span>
      </button>

      {count > 1 && (
        <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1" role="group" aria-label="Miniaturi">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Imaginea ${i + 1} din ${count}`}
              aria-current={i === active}
              className={cn(
                'relative size-14 flex-none snap-start overflow-hidden rounded-control border bg-blueprint transition-colors',
                i === active ? 'border-accent' : 'border-border hover:border-faint',
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="56px"
                unoptimized={img.url.startsWith('data:')}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-bg/95"
          role="dialog"
          aria-modal
          aria-label={`${title} — galerie`}
        >
          <div className="flex items-center justify-between p-3">
            <span className="font-mono text-xs text-muted">
              {active + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Închide galeria"
              onClick={() => setLightbox(false)}
              className="flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:text-fg"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={current.url}
              alt={current.alt ?? title}
              fill
              sizes="100vw"
              unoptimized={unoptimized}
              className="object-contain p-4"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imaginea anterioară"
                  onClick={() => step(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-control border border-border bg-surface/90 p-2 text-muted transition-colors hover:text-fg"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Imaginea următoare"
                  onClick={() => step(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-control border border-border bg-surface/90 p-2 text-muted transition-colors hover:text-fg"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

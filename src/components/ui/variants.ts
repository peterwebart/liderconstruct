import { cn } from '@/lib/cn'

/**
 * Button styling source of truth — a PURE module (no 'use client') so both
 * server components (e.g. <Link className={buttonVariants(...)}>) and the
 * client <Button> share it. Keep this file free of React/browser imports:
 * a client directive here would turn buttonVariants back into a client
 * reference that servers cannot call.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none'

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-600 active:bg-accent-600',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-stock-out text-fg hover:opacity-90',
}

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

/** Class builder so links and other elements can share button styling. */
export function buttonVariants(
  opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  return cn(
    buttonBase,
    buttonVariantClasses[opts.variant ?? 'primary'],
    buttonSizeClasses[opts.size ?? 'md'],
    opts.className,
  )
}

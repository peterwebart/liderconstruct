'use client'

import { Loader2 } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/cn'

import {
  buttonBase,
  buttonVariantClasses,
  buttonVariants,
  type ButtonSize as Size,
  type ButtonVariant as Variant,
} from './variants'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconStart?: React.ReactNode
  iconEnd?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconStart,
  iconEnd,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : iconStart}
      {children}
      {!loading && iconEnd}
    </button>
  )
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: Variant
  size?: Size
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps): React.JSX.Element {
  const square: Record<Size, string> = { sm: 'size-8', md: 'size-10', lg: 'size-12' }
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(buttonBase, buttonVariantClasses[variant], square[size], 'px-0', className)}
      {...props}
    >
      {children}
    </button>
  )
}

'use client'

import React from 'react'

import { cn } from '@/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconStart?: React.ReactNode
  iconEnd?: React.ReactNode
  error?: boolean
  inputSize?: 'md' | 'lg'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { iconStart, iconEnd, error, inputSize = 'md', className, ...props },
  ref,
): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-control border bg-surface-2 px-3 transition-colors duration-150',
        'focus-within:border-accent',
        error ? 'border-stock-out' : 'border-border',
        inputSize === 'lg' ? 'h-12' : 'h-10',
        className,
      )}
    >
      {iconStart && (
        <span className="shrink-0 text-faint" aria-hidden>
          {iconStart}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent text-fg outline-none placeholder:text-faint',
          inputSize === 'lg' ? 'text-base' : 'text-sm',
        )}
        {...props}
      />
      {iconEnd && <span className="flex shrink-0 items-center">{iconEnd}</span>}
    </div>
  )
})

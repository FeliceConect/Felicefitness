'use client'

import { cn } from '@/lib/utils'

interface SrOnlyProps {
  children: React.ReactNode
  className?: string
}

export function SrOnly({ children, className }: SrOnlyProps) {
  return <span className={cn('sr-only', className)}>{children}</span>
}

// Visually hidden but focusable
export function VisuallyHidden({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        'clip-[rect(0,0,0,0)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

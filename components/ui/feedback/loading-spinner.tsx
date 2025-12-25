'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'muted'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-3',
  }

  const colors = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    muted: 'border-foreground-muted border-t-transparent',
  }

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

// Three dots loading indicator
export function LoadingDots({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full animate-bounce',
            sizes[size]
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// Pulse loading indicator
export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className="w-8 h-8 bg-primary rounded-full animate-ping opacity-75" />
      <div className="absolute w-6 h-6 bg-primary rounded-full" />
    </div>
  )
}

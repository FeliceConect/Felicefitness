'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  fullPage?: boolean
  className?: string
}

export function LoadingState({
  message = 'Carregando...',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const containerClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'py-12 flex items-center justify-center'

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-foreground-muted text-sm">{message}</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

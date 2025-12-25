'use client'

import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

interface CoachAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function CoachAvatar({
  size = 'md',
  className,
  animated = false,
}: CoachAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg',
        sizeClasses[size],
        animated && 'animate-pulse',
        className
      )}
    >
      <Bot className={iconSizes[size]} />
    </div>
  )
}

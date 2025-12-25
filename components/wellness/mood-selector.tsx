'use client'

import { cn } from '@/lib/utils'
import { MOOD_LEVELS } from '@/lib/wellness/moods'

interface MoodSelectorProps {
  value: number | null
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MoodSelector({
  value,
  onChange,
  size = 'md',
  className,
}: MoodSelectorProps) {
  const sizeClasses = {
    sm: 'text-2xl p-2',
    md: 'text-4xl p-3',
    lg: 'text-5xl p-4',
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {MOOD_LEVELS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={cn(
            'rounded-full transition-all duration-200',
            sizeClasses[size],
            value === mood.value
              ? 'scale-125 ring-2 ring-offset-2 ring-offset-background'
              : 'opacity-50 hover:opacity-75 hover:scale-110',
            value === mood.value && 'ring-primary'
          )}
          style={{
            backgroundColor:
              value === mood.value ? `${mood.color}20` : 'transparent',
          }}
          title={mood.label}
        >
          <span role="img" aria-label={mood.label}>
            {mood.emoji}
          </span>
        </button>
      ))}
    </div>
  )
}

interface MoodDisplayProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function MoodDisplay({
  value,
  size = 'md',
  showLabel = false,
  className,
}: MoodDisplayProps) {
  const mood = MOOD_LEVELS.find((m) => m.value === value)
  if (!mood) return null

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <span className={cn(sizeClasses[size])} role="img" aria-label={mood.label}>
        {mood.emoji}
      </span>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: mood.color }}>
          {mood.label}
        </span>
      )}
    </div>
  )
}

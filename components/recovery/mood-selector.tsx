'use client'

import { cn } from '@/lib/utils'
import { MOOD_LABELS } from '@/types/sleep'

interface MoodSelectorProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
  const selectedLabel = MOOD_LABELS.find(l => l.value === value)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between gap-2">
        {MOOD_LABELS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
              value === option.value
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-muted hover:border-muted-foreground/30'
            )}
          >
            <span className="text-2xl">{option.emoji}</span>
          </button>
        ))}
      </div>

      {selectedLabel && (
        <p className="text-sm text-center font-medium">
          {selectedLabel.label}
        </p>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { WAKE_FEELING_LABELS } from '@/types/sleep'

interface WakeFeelingInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function WakeFeelingInput({ value, onChange, className }: WakeFeelingInputProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2">
        {WAKE_FEELING_LABELS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
              value === option.value
                ? 'border-primary bg-primary/10'
                : 'border-muted hover:border-muted-foreground/30'
            )}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div>
              <span className="font-medium">{option.label}</span>
              {value === option.value && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

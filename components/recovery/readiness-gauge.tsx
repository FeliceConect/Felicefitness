'use client'

import { cn } from '@/lib/utils'
import { READINESS_LABELS } from '@/types/sleep'

interface ReadinessGaugeProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function ReadinessGauge({ value, onChange, className }: ReadinessGaugeProps) {
  const selectedLabel = READINESS_LABELS.find(l => l.value === value)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between gap-2">
        {READINESS_LABELS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all',
              value === option.value
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-muted hover:border-muted-foreground/30'
            )}
          >
            <span className="text-lg font-bold">{option.value}</span>
          </button>
        ))}
      </div>

      {selectedLabel && (
        <div className="text-center space-y-1">
          <p className="font-medium">{selectedLabel.label}</p>
          <p className="text-sm text-muted-foreground">{selectedLabel.recommendation}</p>
        </div>
      )}
    </div>
  )
}

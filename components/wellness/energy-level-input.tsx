'use client'

import { cn } from '@/lib/utils'
import { ENERGY_LEVELS } from '@/lib/wellness/moods'

interface EnergyLevelInputProps {
  value: number | null
  onChange: (value: number) => void
  className?: string
}

export function EnergyLevelInput({
  value,
  onChange,
  className,
}: EnergyLevelInputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-center gap-2">
        {ENERGY_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
              value === level.value
                ? 'bg-primary/10 ring-2 ring-primary scale-110'
                : 'bg-muted/50 hover:bg-muted opacity-60 hover:opacity-80'
            )}
          >
            <span className="text-2xl">{level.emoji}</span>
          </button>
        ))}
      </div>

      {value && (
        <p className="text-center text-sm font-medium text-muted-foreground">
          {ENERGY_LEVELS.find((l) => l.value === value)?.label}
        </p>
      )}
    </div>
  )
}

interface EnergyDisplayProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EnergyDisplay({
  value,
  showLabel = true,
  size = 'md',
  className,
}: EnergyDisplayProps) {
  const level = ENERGY_LEVELS.find((l) => l.value === value)
  if (!level) return null

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={sizeClasses[size]}>{level.emoji}</span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{level.label}</span>
      )}
    </div>
  )
}

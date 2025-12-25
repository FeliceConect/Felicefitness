'use client'

import { cn } from '@/lib/utils'
import { POSITIVE_FACTORS, NEGATIVE_FACTORS } from '@/lib/wellness/moods'

interface MoodFactorsInputProps {
  positiveFactors: string[]
  negativeFactors: string[]
  onPositiveChange: (factors: string[]) => void
  onNegativeChange: (factors: string[]) => void
  className?: string
}

export function MoodFactorsInput({
  positiveFactors,
  negativeFactors,
  onPositiveChange,
  onNegativeChange,
  className,
}: MoodFactorsInputProps) {
  const togglePositive = (id: string) => {
    if (positiveFactors.includes(id)) {
      onPositiveChange(positiveFactors.filter((f) => f !== id))
    } else {
      onPositiveChange([...positiveFactors, id])
    }
  }

  const toggleNegative = (id: string) => {
    if (negativeFactors.includes(id)) {
      onNegativeChange(negativeFactors.filter((f) => f !== id))
    } else {
      onNegativeChange([...negativeFactors, id])
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Positive factors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Positivo:
        </h4>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_FACTORS.map((factor) => (
            <FactorChip
              key={factor.id}
              factor={factor}
              selected={positiveFactors.includes(factor.id)}
              onClick={() => togglePositive(factor.id)}
              variant="positive"
            />
          ))}
        </div>
      </div>

      {/* Negative factors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Negativo:
        </h4>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_FACTORS.map((factor) => (
            <FactorChip
              key={factor.id}
              factor={factor}
              selected={negativeFactors.includes(factor.id)}
              onClick={() => toggleNegative(factor.id)}
              variant="negative"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface FactorChipProps {
  factor: { id: string; label: string; icon: string }
  selected: boolean
  onClick: () => void
  variant: 'positive' | 'negative'
}

function FactorChip({ factor, selected, onClick, variant }: FactorChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
        selected
          ? variant === 'positive'
            ? 'bg-green-500/20 text-green-700 dark:text-green-400 ring-1 ring-green-500/50'
            : 'bg-red-500/20 text-red-700 dark:text-red-400 ring-1 ring-red-500/50'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      <span>{factor.icon}</span>
      <span>{factor.label}</span>
    </button>
  )
}

interface FactorsDisplayProps {
  positiveFactors: string[]
  negativeFactors: string[]
  className?: string
}

export function FactorsDisplay({
  positiveFactors,
  negativeFactors,
  className,
}: FactorsDisplayProps) {
  const positive = POSITIVE_FACTORS.filter((f) => positiveFactors.includes(f.id))
  const negative = NEGATIVE_FACTORS.filter((f) => negativeFactors.includes(f.id))

  if (positive.length === 0 && negative.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {positive.map((factor) => (
        <span
          key={factor.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400"
        >
          {factor.icon} {factor.label}
        </span>
      ))}
      {negative.map((factor) => (
        <span
          key={factor.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-700 dark:text-red-400"
        >
          {factor.icon} {factor.label}
        </span>
      ))}
    </div>
  )
}

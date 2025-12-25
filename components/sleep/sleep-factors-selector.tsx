'use client'

import { cn } from '@/lib/utils'
import { POSITIVE_FACTORS, NEGATIVE_FACTORS, type SleepFactor } from '@/types/sleep'

interface SleepFactorsSelectorProps {
  selectedPositive: string[]
  selectedNegative: string[]
  onChangePositive: (factors: string[]) => void
  onChangeNegative: (factors: string[]) => void
  className?: string
}

export function SleepFactorsSelector({
  selectedPositive,
  selectedNegative,
  onChangePositive,
  onChangeNegative,
  className,
}: SleepFactorsSelectorProps) {
  const toggleFactor = (
    factorId: string,
    selected: string[],
    onChange: (factors: string[]) => void
  ) => {
    if (selected.includes(factorId)) {
      onChange(selected.filter(f => f !== factorId))
    } else {
      onChange([...selected, factorId])
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Positive Factors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm font-medium">Fatores positivos</span>
        </div>
        <FactorGrid
          factors={POSITIVE_FACTORS}
          selected={selectedPositive}
          onToggle={(id) => toggleFactor(id, selectedPositive, onChangePositive)}
          positiveStyle
        />
      </div>

      {/* Negative Factors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm font-medium">Fatores negativos</span>
        </div>
        <FactorGrid
          factors={NEGATIVE_FACTORS}
          selected={selectedNegative}
          onToggle={(id) => toggleFactor(id, selectedNegative, onChangeNegative)}
          positiveStyle={false}
        />
      </div>
    </div>
  )
}

interface FactorGridProps {
  factors: SleepFactor[]
  selected: string[]
  onToggle: (id: string) => void
  positiveStyle: boolean
}

function FactorGrid({ factors, selected, onToggle, positiveStyle }: FactorGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {factors.map((factor) => {
        const isSelected = selected.includes(factor.id)
        return (
          <button
            key={factor.id}
            type="button"
            onClick={() => onToggle(factor.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all',
              isSelected
                ? positiveStyle
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-2 border-green-500'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400 border-2 border-red-500'
                : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
            )}
          >
            <span>{factor.icon}</span>
            <span>{factor.label}</span>
          </button>
        )
      })}
    </div>
  )
}

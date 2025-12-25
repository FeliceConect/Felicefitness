'use client'

import { cn } from '@/lib/utils'
import { ENERGY_LABELS } from '@/types/sleep'
import { BatteryLow, BatteryMedium, BatteryFull, BatteryCharging } from 'lucide-react'

interface EnergyLevelInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

const ICONS = [BatteryLow, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging]

export function EnergyLevelInput({ value, onChange, className }: EnergyLevelInputProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between gap-2">
        {ENERGY_LABELS.map((option, index) => {
          const Icon = ICONS[index]
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                value === option.value
                  ? 'border-primary bg-primary/10 scale-105'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <Icon className={cn('h-6 w-6', option.color)} />
              <span className="text-xs font-medium">{option.value}</span>
            </button>
          )
        })}
      </div>

      {value > 0 && (
        <div className="text-center">
          <p className={cn('font-medium', ENERGY_LABELS[value - 1].color)}>
            {ENERGY_LABELS[value - 1].label}
          </p>
        </div>
      )}
    </div>
  )
}

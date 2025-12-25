'use client'

import { cn } from '@/lib/utils'
import { STRESS_LABELS } from '@/types/sleep'

interface StressLevelInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function StressLevelInput({ value, onChange, className }: StressLevelInputProps) {
  const selectedLabel = STRESS_LABELS.find(l => l.value === value)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Slider track */}
      <div className="relative pt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Baixo</span>
          <span>Alto</span>
        </div>

        <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
          {/* Slider dots */}
          <div className="absolute inset-0 flex justify-between items-center px-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange(level)}
                className={cn(
                  'w-6 h-6 rounded-full border-4 border-white transition-transform',
                  value === level ? 'scale-125 bg-white shadow-lg' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedLabel && (
        <div className="text-center">
          <p className="font-medium">{selectedLabel.label}</p>
        </div>
      )}
    </div>
  )
}

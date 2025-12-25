'use client'

import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { STRESS_LEVELS } from '@/lib/wellness/moods'

interface StressLevelInputProps {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
  className?: string
}

export function StressLevelInput({
  value,
  onChange,
  readonly = false,
  className,
}: StressLevelInputProps) {
  const currentLevel = STRESS_LEVELS.find((s) => s.value === value)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Baixo</span>
        <span>Alto</span>
      </div>

      <Slider
        value={[value]}
        min={1}
        max={5}
        step={1}
        disabled={readonly}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />

      <div className="flex justify-center">
        <div
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${currentLevel?.color}20`,
            color: currentLevel?.color,
          }}
        >
          {value}/5 - {currentLevel?.label}
        </div>
      </div>
    </div>
  )
}

interface StressGaugeProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StressGauge({ value, size = 'md', className }: StressGaugeProps) {
  const currentLevel = STRESS_LEVELS.find((s) => s.value === value)
  const percentage = ((value - 1) / 4) * 100

  const sizeConfig = {
    sm: { width: 80, height: 40, strokeWidth: 6, fontSize: 'text-xs' },
    md: { width: 120, height: 60, strokeWidth: 8, fontSize: 'text-sm' },
    lg: { width: 160, height: 80, strokeWidth: 10, fontSize: 'text-base' },
  }

  const config = sizeConfig[size]

  // Create semi-circle arc
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={config.width}
        height={config.height + 10}
        viewBox={`0 0 ${config.width} ${config.height + 10}`}
      >
        {/* Background arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${config.height} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-muted/20"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${config.height} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height}`}
          fill="none"
          stroke={currentLevel?.color || '#6B7280'}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className={cn('font-semibold -mt-2', config.fontSize)}
        style={{ color: currentLevel?.color }}
      >
        {currentLevel?.label}
      </span>
    </div>
  )
}

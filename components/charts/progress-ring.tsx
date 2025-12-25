'use client'

import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showValue?: boolean
  valueFormatter?: (value: number) => string
  label?: string
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#8b5cf6',
  backgroundColor = 'hsl(var(--muted))',
  showValue = true,
  valueFormatter,
  label,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(value / max, 1)
  const offset = circumference - percentage * circumference

  const displayValue = valueFormatter
    ? valueFormatter(value)
    : `${Math.round(percentage * 100)}%`

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{displayValue}</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  )
}

// Multiple rings variant for comparing metrics
interface MultiProgressRingProps {
  rings: {
    value: number
    max?: number
    color: string
    label: string
  }[]
  size?: number
  strokeWidth?: number
  gap?: number
  className?: string
}

export function MultiProgressRing({
  rings,
  size = 140,
  strokeWidth = 6,
  gap = 4,
  className
}: MultiProgressRingProps) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, index) => {
          const radius = (size - strokeWidth) / 2 - (index * (strokeWidth + gap))
          const circumference = radius * 2 * Math.PI
          const percentage = Math.min(ring.value / (ring.max || 100), 1)
          const offset = circumference - percentage * circumference

          return (
            <g key={index}>
              {/* Background */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                opacity={0.3}
              />
              {/* Progress */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-3">
        {rings.map((ring, index) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ring.color }} />
            <span className="text-muted-foreground">{ring.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

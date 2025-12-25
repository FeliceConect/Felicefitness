'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { WellnessScoreComponents } from '@/types/wellness'

interface WellnessScoreProps {
  score: number | null
  components?: WellnessScoreComponents
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  className?: string
}

export function WellnessScore({
  score,
  components,
  size = 'md',
  showBreakdown = true,
  className,
}: WellnessScoreProps) {
  // Get score color
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22C55E'
    if (s >= 60) return '#84CC16'
    if (s >= 40) return '#EAB308'
    if (s >= 20) return '#F97316'
    return '#EF4444'
  }

  const scoreColor = score !== null ? getScoreColor(score) : '#6B7280'

  const sizeConfig = {
    sm: { circle: 80, text: 'text-2xl', label: 'text-xs' },
    md: { circle: 120, text: 'text-4xl', label: 'text-sm' },
    lg: { circle: 160, text: 'text-5xl', label: 'text-base' },
  }

  const config = sizeConfig[size]
  const radius = (config.circle - 12) / 2
  const circumference = 2 * Math.PI * radius
  const progress = score !== null ? (score / 100) * circumference : 0

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Score circle */}
      <div className="relative">
        <svg
          width={config.circle}
          height={config.circle}
          viewBox={`0 0 ${config.circle} ${config.circle}`}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', config.text)} style={{ color: scoreColor }}>
            {score !== null ? score : '--'}
          </span>
          <span className={cn('text-muted-foreground', config.label)}>/100</span>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && components && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <ScoreComponent
            label="Humor"
            value={components.mood}
            max={5}
            emoji="😊"
          />
          <ScoreComponent
            label="Stress"
            value={6 - components.stress}
            max={5}
            emoji="🧘"
            inverted
          />
          <ScoreComponent
            label="Energia"
            value={components.energy}
            max={5}
            emoji="⚡"
          />
          <ScoreComponent
            label="Sono"
            value={Math.round(components.sleep / 20)}
            max={5}
            emoji="😴"
          />
        </div>
      )}
    </div>
  )
}

interface ScoreComponentProps {
  label: string
  value: number
  max: number
  emoji: string
  inverted?: boolean
}

function ScoreComponent({ label, value, max, emoji, inverted }: ScoreComponentProps) {
  const displayValue = inverted ? value : value
  const percentage = (displayValue / max) * 100

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-sm">{emoji}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums">
            {inverted ? 6 - value : value}/{max}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

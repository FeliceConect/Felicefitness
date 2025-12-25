'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PatternCardProps {
  title: string
  icon: string
  description: string
  data?: {
    label: string
    value: string | number
    highlight?: boolean
  }[]
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    label: string
  }
}

export function PatternCard({
  title,
  icon,
  description,
  data,
  trend,
}: PatternCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>

        {data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'p-2 rounded-lg',
                  item.highlight ? 'bg-primary/10' : 'bg-muted/50'
                )}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={cn(
                    'font-medium',
                    item.highlight && 'text-primary'
                  )}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <span
              className={cn(
                'text-lg',
                trend.direction === 'up' && 'text-green-500',
                trend.direction === 'down' && 'text-red-500',
                trend.direction === 'stable' && 'text-yellow-500'
              )}
            >
              {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
            </span>
            <div>
              <p className="text-sm font-medium">
                {trend.percentage.toFixed(0)}%{' '}
                {trend.direction === 'up'
                  ? 'aumento'
                  : trend.direction === 'down'
                    ? 'diminuição'
                    : 'estável'}
              </p>
              <p className="text-xs text-muted-foreground">{trend.label}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CorrelationCardProps {
  metric1: string
  metric2: string
  coefficient: number
  interpretation: string
}

export function CorrelationCard({
  metric1,
  metric2,
  coefficient,
  interpretation,
}: CorrelationCardProps) {
  const isPositive = coefficient > 0
  const strength = Math.abs(coefficient)
  const strengthLabel =
    strength > 0.7
      ? 'Forte'
      : strength > 0.4
        ? 'Moderada'
        : strength > 0.2
          ? 'Fraca'
          : 'Muito fraca'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">
              {metric1} + {metric2}
            </h4>
            <p className="text-sm text-muted-foreground mb-2">{interpretation}</p>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  isPositive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {isPositive ? '+' : '-'}
                {(strength * 100).toFixed(0)}%
              </div>
              <span className="text-xs text-muted-foreground">
                Correlação {strengthLabel.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WeeklyPatternChartProps {
  data: {
    dayOfWeek: string
    value: number
    label?: string
  }[]
  maxValue?: number
  color?: 'primary' | 'green' | 'blue' | 'orange'
}

export function WeeklyPatternChart({
  data,
  maxValue,
  color = 'primary',
}: WeeklyPatternChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1)

  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  }

  return (
    <div className="flex items-end justify-between gap-1 h-20">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-center gap-1"
        >
          <div className="w-full flex items-end justify-center h-14">
            <div
              className={cn(
                'w-full max-w-8 rounded-t transition-all',
                colorClasses[color]
              )}
              style={{
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? '4px' : '0',
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {item.dayOfWeek.slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import type { WellnessTip } from '@/types/wellness'

interface WellnessTipCardProps {
  tip: WellnessTip
  className?: string
}

export function WellnessTipCard({ tip, className }: WellnessTipCardProps) {
  return (
    <Card className={cn('bg-primary/5 border-primary/20', className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Dica de Bem-estar</p>
            <p className="text-sm text-muted-foreground">{tip.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WellnessInsightCardProps {
  icon: string
  title: string
  description: string
  value?: string
  progress?: number
  className?: string
}

export function WellnessInsightCard({
  icon,
  title,
  description,
  value,
  progress,
  className,
}: WellnessInsightCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {value && (
                <span className="text-lg font-bold text-primary">{value}</span>
              )}
            </div>
            {progress !== undefined && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CorrelationCardProps {
  icon: string
  title: string
  description: string
  correlation: number // -1 to 1
  className?: string
}

export function CorrelationCard({
  icon,
  title,
  description,
  correlation,
  className,
}: CorrelationCardProps) {
  const percentage = Math.abs(correlation) * 100
  const isPositive = correlation > 0

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1 space-y-2">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {isPositive ? '+' : '-'}
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

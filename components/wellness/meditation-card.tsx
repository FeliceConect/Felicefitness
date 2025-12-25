'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Clock } from 'lucide-react'
import { getCategoryLabel } from '@/lib/wellness/meditations'
import type { Meditation } from '@/types/wellness'

interface MeditationCardProps {
  meditation: Meditation
  onStart: () => void
  recommended?: boolean
  className?: string
}

export function MeditationCard({
  meditation,
  onStart,
  recommended = false,
  className,
}: MeditationCardProps) {
  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        recommended && 'ring-2 ring-primary',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
              recommended ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            {meditation.icon}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                {recommended && (
                  <span className="text-xs text-primary font-medium">
                    Recomendado para você
                  </span>
                )}
                <h3 className="font-semibold">{meditation.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {meditation.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meditation.duration} min
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted">
                  {getCategoryLabel(meditation.category)}
                </span>
              </div>

              <Button size="sm" onClick={onStart} className="gap-1">
                <Play className="h-3 w-3" />
                Iniciar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MeditationCategoryHeaderProps {
  category: string
  icon: string
  count: number
  className?: string
}

export function MeditationCategoryHeader({
  category,
  icon,
  count,
  className,
}: MeditationCategoryHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{category}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  )
}

interface MeditationStatsProps {
  sessionsThisWeek: number
  minutesThisWeek: number
  className?: string
}

export function MeditationStats({
  sessionsThisWeek,
  minutesThisWeek,
  className,
}: MeditationStatsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Esta Semana
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{sessionsThisWeek}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{minutesThisWeek}</p>
            <p className="text-xs text-muted-foreground">Minutos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

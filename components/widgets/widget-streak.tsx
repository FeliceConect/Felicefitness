'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import type { WidgetSize, StreakWidgetData } from '@/types/widgets'

interface WidgetStreakProps {
  size: WidgetSize
  data: StreakWidgetData
  onClick?: () => void
}

export function WidgetStreak({ size, data, onClick }: WidgetStreakProps) {
  const { current, record, nextMilestone, daysToMilestone } = data

  const getFlameSize = () => {
    if (current >= 30) return 'text-4xl'
    if (current >= 14) return 'text-3xl'
    if (current >= 7) return 'text-2xl'
    return 'text-xl'
  }

  const getFlameIntensity = () => {
    if (current >= 30) return 'from-red-500 via-orange-500 to-yellow-400'
    if (current >= 14) return 'from-orange-500 via-orange-400 to-yellow-400'
    if (current >= 7) return 'from-orange-400 to-yellow-400'
    return 'from-orange-300 to-yellow-300'
  }

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative w-10 h-10 rounded-full bg-gradient-to-b flex items-center justify-center',
              getFlameIntensity()
            )}
          >
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <p className="text-lg font-bold text-orange-400">{current}</p>
            <p className="text-xs text-muted-foreground">dias</p>
          </div>
        </div>
      </Card>
    )
  }

  // Medium size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Streak
            </span>
          </div>
          {current >= record && current > 0 && (
            <span className="text-xs text-yellow-400 font-medium">Recorde!</span>
          )}
        </div>

        <div className="text-center py-2">
          <div className="relative inline-block">
            <span className={cn('animate-bounce', getFlameSize())}>🔥</span>
            <div className="absolute inset-0 animate-ping opacity-30">
              <span className={getFlameSize()}>🔥</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-400 mt-1">{current}</p>
          <p className="text-sm text-muted-foreground">dias consecutivos</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <span>Recorde: {record} dias</span>
          {daysToMilestone > 0 && (
            <span className="text-orange-400">
              {nextMilestone} dias em {daysToMilestone}!
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

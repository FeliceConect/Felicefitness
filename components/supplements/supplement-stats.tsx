'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SupplementStats } from '@/types/supplements'
import { TrendingUp, Calendar, Target, Flame } from 'lucide-react'

interface SupplementStatsCardProps {
  stats: SupplementStats
  className?: string
}

export function SupplementStatsCard({ stats, className }: SupplementStatsCardProps) {
  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500'
    if (rate >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Adherence Rate */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Aderência</p>
            <p className={cn('text-2xl font-bold', getAdherenceColor(stats.adherenceRate))}>
              {stats.adherenceRate}%
            </p>
          </div>

          {/* Perfect Days */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>Dias Perfeitos</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.perfectDays}
              <span className="text-sm font-normal text-muted-foreground">
                /{stats.totalDays}
              </span>
            </p>
          </div>

          {/* Current Streak */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Flame className="h-3 w-3" />
              <span>Sequência Atual</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{stats.currentStreak}</p>
          </div>

          {/* Best Streak */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span>Melhor Sequência</span>
            </div>
            <p className="text-2xl font-bold">{stats.bestStreak}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Doses tomadas</span>
            <span className="font-medium">
              {stats.totalDosesTaken}/{stats.totalDosesScheduled}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${stats.totalDosesScheduled > 0 ? (stats.totalDosesTaken / stats.totalDosesScheduled) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

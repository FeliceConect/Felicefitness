'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DailyCheckin } from '@/types/sleep'
import { getDayOfWeekPt, getRecoveryScoreColor } from '@/lib/sleep/calculations'
import { TrendingUp } from 'lucide-react'

interface RecoveryHistoryProps {
  history: DailyCheckin[]
  className?: string
}

export function RecoveryHistory({ history, className }: RecoveryHistoryProps) {
  // Get last 7 days
  const recentHistory = history.slice(0, 7).reverse()

  // Find max score for scaling
  const maxScore = Math.max(...recentHistory.map(h => h.recovery_score), 100)

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Histórico da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-32">
          {recentHistory.map((checkin, index) => {
            const heightPercent = (checkin.recovery_score / maxScore) * 100
            const date = new Date(checkin.date + 'T12:00:00')
            const scoreColor = getRecoveryScoreColor(checkin.recovery_score)

            return (
              <div key={checkin.id || index} className="flex-1 flex flex-col items-center gap-1">
                <span className={cn('text-xs font-medium', scoreColor)}>
                  {checkin.recovery_score}
                </span>
                <div className="relative w-full h-20 flex items-end justify-center">
                  <div
                    className={cn(
                      'w-full max-w-8 rounded-t-md transition-all',
                      checkin.recovery_score >= 80 && 'bg-green-500',
                      checkin.recovery_score >= 60 && checkin.recovery_score < 80 && 'bg-yellow-500',
                      checkin.recovery_score >= 40 && checkin.recovery_score < 60 && 'bg-orange-500',
                      checkin.recovery_score < 40 && 'bg-red-500'
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {getDayOfWeekPt(date)}
                </span>
              </div>
            )
          })}

          {/* Fill empty days if less than 7 */}
          {Array.from({ length: 7 - recentHistory.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-muted">-</span>
              <div className="w-full h-20 flex items-end justify-center">
                <div className="w-full max-w-8 h-2 rounded-t-md bg-muted" />
              </div>
              <span className="text-xs text-muted-foreground">-</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

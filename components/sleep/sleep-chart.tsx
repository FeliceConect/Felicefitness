'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SleepLog } from '@/types/sleep'
import { getDayOfWeekPt } from '@/lib/sleep/calculations'

interface SleepChartProps {
  logs: SleepLog[]
  goalHours?: number
  className?: string
}

export function SleepChart({ logs, goalHours = 7, className }: SleepChartProps) {
  // Get last 7 days of logs
  const recentLogs = logs.slice(0, 7).reverse()

  // Find max duration for scaling
  const maxDuration = Math.max(...recentLogs.map(l => l.duration), goalHours * 60)
  const goalMinutes = goalHours * 60

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Duração por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-32">
          {recentLogs.map((log, index) => {
            const heightPercent = (log.duration / maxDuration) * 100
            const goalHeightPercent = (goalMinutes / maxDuration) * 100
            const isOnGoal = log.duration >= goalMinutes - 15
            const date = new Date(log.date + 'T12:00:00')

            return (
              <div key={log.id || index} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full h-24 flex items-end justify-center">
                  {/* Goal line indicator */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-primary/30"
                    style={{ bottom: `${goalHeightPercent}%` }}
                  />

                  {/* Bar */}
                  <div
                    className={cn(
                      'w-full max-w-8 rounded-t-md transition-all',
                      isOnGoal ? 'bg-green-500' : 'bg-primary/60'
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
          {Array.from({ length: 7 - recentLogs.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-24 flex items-end justify-center">
                <div className="w-full max-w-8 h-2 rounded-t-md bg-muted" />
              </div>
              <span className="text-xs text-muted-foreground">-</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500" />
            <span>Na meta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary/60" />
            <span>Abaixo da meta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

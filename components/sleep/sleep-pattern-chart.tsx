'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SleepLog } from '@/types/sleep'
import { timeToMinutes } from '@/lib/sleep/calculations'

interface SleepPatternChartProps {
  logs: SleepLog[]
  className?: string
}

export function SleepPatternChart({ logs, className }: SleepPatternChartProps) {
  // Get last 7 days
  const recentLogs = logs.slice(0, 7).reverse()

  // Timeline from 21:00 to 08:00 (11 hours span)
  const timelineStart = 21 * 60 // 21:00 in minutes
  const timelineEnd = 8 * 60 + 24 * 60 // 08:00 next day in minutes
  const timelineRange = timelineEnd - timelineStart

  const getPosition = (time: string): number => {
    let minutes = timeToMinutes(time)
    // Handle times after midnight
    if (minutes < 12 * 60) {
      minutes += 24 * 60
    }
    return ((minutes - timelineStart) / timelineRange) * 100
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Padrão de Horários</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Time labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>21:00</span>
          <span>00:00</span>
          <span>03:00</span>
          <span>06:00</span>
        </div>

        {/* Pattern visualization */}
        <div className="space-y-2">
          {recentLogs.map((log, index) => {
            const bedPosition = getPosition(log.bedtime)
            const wakePosition = getPosition(log.wake_time)
            const width = wakePosition - bedPosition
            const date = new Date(log.date + 'T12:00:00')
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })

            return (
              <div key={log.id || index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">{dayName}</span>
                <div className="flex-1 relative h-4 bg-muted rounded">
                  <div
                    className="absolute h-full bg-primary rounded"
                    style={{
                      left: `${Math.max(0, bedPosition)}%`,
                      width: `${Math.min(100 - bedPosition, width)}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}

          {/* Fill empty days */}
          {Array.from({ length: 7 - recentLogs.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">-</span>
              <div className="flex-1 h-4 bg-muted rounded opacity-50" />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary">●</span>
            <span>Hora de dormir</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">●</span>
            <span>Hora de acordar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

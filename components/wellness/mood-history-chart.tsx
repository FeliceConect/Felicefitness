'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMoodLevel, getMoodColor } from '@/lib/wellness/moods'
import type { WeekMoodData } from '@/types/wellness'

interface MoodHistoryChartProps {
  data: WeekMoodData[]
  title?: string
  className?: string
}

export function MoodHistoryChart({
  data,
  title = 'Humor da Semana',
  className,
}: MoodHistoryChartProps) {
  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 gap-2">
          {data.map((item) => {
            const date = new Date(item.date)
            const dayIndex = date.getDay()
            const mood = item.mood ? getMoodLevel(item.mood) : null
            const height = item.mood ? (item.mood / 5) * 100 : 0
            const isToday = item.date === new Date().toISOString().split('T')[0]

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {/* Bar container */}
                <div className="relative w-full h-24 flex flex-col justify-end items-center">
                  {item.mood ? (
                    <div
                      className={cn(
                        'w-8 rounded-t-md transition-all duration-300 flex items-start justify-center pt-1',
                        isToday && 'ring-2 ring-primary ring-offset-1'
                      )}
                      style={{
                        height: `${height}%`,
                        backgroundColor: getMoodColor(item.mood),
                      }}
                    >
                      <span className="text-xs">{mood?.emoji}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-4 bg-muted rounded-md" />
                  )}
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    'text-xs',
                    isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                  )}
                >
                  {dayNames[dayIndex]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getMoodColor(1) }}
            />
            <span>Ruim</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getMoodColor(3) }}
            />
            <span>Neutro</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getMoodColor(5) }}
            />
            <span>Ótimo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MoodTrendIndicatorProps {
  trend: 'up' | 'down' | 'stable'
  className?: string
}

export function MoodTrendIndicator({ trend, className }: MoodTrendIndicatorProps) {
  const config = {
    up: { icon: '📈', label: 'Melhorando', color: 'text-green-500' },
    down: { icon: '📉', label: 'Caindo', color: 'text-red-500' },
    stable: { icon: '➡️', label: 'Estável', color: 'text-yellow-500' },
  }

  const { icon, label, color } = config[trend]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span>{icon}</span>
      <span className={cn('text-sm font-medium', color)}>{label}</span>
    </div>
  )
}

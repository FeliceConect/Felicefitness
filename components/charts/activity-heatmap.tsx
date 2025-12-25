'use client'

import { cn } from '@/lib/utils'
import { format, parseISO, startOfWeek, addDays, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityDay {
  date: string
  value: number // 0-4 intensity level
  label?: string
}

interface ActivityHeatmapProps {
  data: ActivityDay[]
  weeks?: number
  colorEmpty?: string
  colorScale?: string[]
  showLabels?: boolean
  showMonths?: boolean
  className?: string
}

const defaultColorScale = [
  'bg-muted',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-500 dark:bg-green-600',
  'bg-green-600 dark:bg-green-500'
]

const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function ActivityHeatmap({
  data,
  weeks = 12,
  colorEmpty = 'bg-muted/30',
  colorScale = defaultColorScale,
  showLabels = true,
  showMonths = true,
  className
}: ActivityHeatmapProps) {
  // Create a map of dates to values
  const dataMap = new Map(data.map(d => [d.date, d]))

  // Calculate start date (beginning of first week)
  const endDate = new Date()
  const startDate = addDays(startOfWeek(endDate, { weekStartsOn: 0 }), -(weeks - 1) * 7)

  // Generate all days
  const days: (ActivityDay | null)[][] = []
  let currentDate = startDate
  let currentWeek: (ActivityDay | null)[] = []

  // Fill in days before start of first week
  const startDayOfWeek = getDay(startDate)
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null)
  }

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dayData = dataMap.get(dateStr)

    currentWeek.push(dayData || { date: dateStr, value: 0 })

    if (currentWeek.length === 7) {
      days.push(currentWeek)
      currentWeek = []
    }

    currentDate = addDays(currentDate, 1)
  }

  // Fill in remaining days of last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    days.push(currentWeek)
  }

  // Get month labels
  const months: { label: string; colStart: number }[] = []
  if (showMonths) {
    let lastMonth = -1
    days.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(d => d !== null)
      if (firstDayOfWeek) {
        const date = parseISO(firstDayOfWeek.date)
        const month = date.getMonth()
        if (month !== lastMonth) {
          months.push({
            label: format(date, 'MMM', { locale: ptBR }),
            colStart: weekIndex
          })
          lastMonth = month
        }
      }
    })
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Month labels */}
      {showMonths && (
        <div className="flex text-xs text-muted-foreground mb-1" style={{ marginLeft: showLabels ? '20px' : 0 }}>
          {months.map((month, i) => (
            <div
              key={i}
              className="text-center"
              style={{
                position: 'relative',
                left: `${month.colStart * 14}px`
              }}
            >
              {month.label}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        {/* Day labels */}
        {showLabels && (
          <div className="flex flex-col gap-[2px] text-xs text-muted-foreground pr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3 w-4 flex items-center justify-center">
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap grid */}
        <div className="flex gap-[2px]">
          {days.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    day === null
                      ? 'bg-transparent'
                      : day.value === 0
                        ? colorEmpty
                        : colorScale[Math.min(day.value, colorScale.length - 1)]
                  )}
                  title={day ? `${format(parseISO(day.date), 'dd/MM/yyyy')}: ${day.label || day.value}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2" style={{ marginLeft: showLabels ? '20px' : 0 }}>
        <span>Menos</span>
        {colorScale.map((color, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CalendarDay } from '@/types/supplements'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SupplementHistoryProps {
  calendarData: CalendarDay[]
  month: Date
  onMonthChange: (date: Date) => void
  onDayClick?: (date: string) => void
  className?: string
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function SupplementHistory({
  calendarData,
  month,
  onMonthChange,
  onDayClick,
  className,
}: SupplementHistoryProps) {
  const monthName = month.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // Get the first day of month to calculate offset
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  const prevMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() - 1)
    onMonthChange(newMonth)
  }

  const nextMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() + 1)
    onMonthChange(newMonth)
  }

  const getStatusColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500 text-white'
      case 'partial':
        return 'bg-yellow-500 text-white'
      case 'missed':
        return 'bg-red-500/20 text-red-500'
      case 'future':
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize w-32 text-center">{monthName}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground py-1">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {calendarData.map(day => {
            const dayNum = parseInt(day.date.split('-')[2])
            return (
              <button
                key={day.date}
                onClick={() => onDayClick?.(day.date)}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors',
                  getStatusColor(day.status),
                  onDayClick && 'hover:opacity-80 cursor-pointer'
                )}
              >
                <span className="font-medium">{dayNum}</span>
                {day.total > 0 && day.status !== 'future' && (
                  <span className="text-[10px] opacity-80">
                    {day.taken}/{day.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Parcial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <span>Perdido</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

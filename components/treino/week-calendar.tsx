"use client"

import { motion } from 'framer-motion'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { DayWorkout } from '@/lib/workout/types'

interface WeekCalendarProps {
  days: DayWorkout[]
  onSelectDay: (day: DayWorkout) => void
  selectedDate?: Date
}

const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

const statusStyles: Record<DayWorkout['status'], string> = {
  completed: 'bg-emerald-500 text-white',
  partial: 'bg-amber-500 text-white',
  pending: 'bg-dourado text-white ring-2 ring-dourado/60 ring-offset-2 ring-offset-background',
  rest: 'bg-background-elevated text-foreground-secondary',
  missed: 'bg-red-500/20 text-red-400 border border-red-500/30',
  future: 'bg-background-elevated text-foreground-secondary'
}

const statusIcons: Record<DayWorkout['status'], string> = {
  completed: '✓',
  partial: '◐',
  pending: '',
  rest: '😴',
  missed: '✗',
  future: ''
}

export function WeekCalendar({ days, onSelectDay, selectedDate }: WeekCalendarProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
          Esta Semana
        </h3>
        <span className="text-xs text-foreground-muted">
          {format(days[0]?.date || new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Nomes dos dias */}
        {dayNames.map((name) => (
          <div key={name} className="text-center">
            <span className="text-xs text-foreground-muted">{name}</span>
          </div>
        ))}

        {/* Dias */}
        {days.map((day) => {
          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
          const isTodayDate = isToday(day.date)

          return (
            <motion.button
              key={day.date.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDay(day)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'w-full aspect-square rounded-xl',
                'transition-all duration-200',
                statusStyles[day.status],
                isSelected && 'ring-2 ring-white/50',
                isTodayDate && day.status === 'pending' && 'animate-pulse'
              )}
            >
              {/* Número do dia */}
              <span className="text-lg font-bold">
                {day.dayOfMonth}
              </span>

              {/* Ícone de status ou especial */}
              {day.icon ? (
                <span className="text-xs">{day.icon}</span>
              ) : statusIcons[day.status] ? (
                <span className="text-xs">{statusIcons[day.status]}</span>
              ) : null}

              {/* Indicador de hoje */}
              {isTodayDate && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

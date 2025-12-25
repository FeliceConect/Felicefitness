'use client'

import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface WellnessStreakProps {
  streak: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function WellnessStreak({
  streak,
  label = 'dias de check-in',
  size = 'md',
  className,
}: WellnessStreakProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-4 w-4',
      text: 'text-lg',
      label: 'text-xs',
      padding: 'px-3 py-1.5',
    },
    md: {
      icon: 'h-5 w-5',
      text: 'text-xl',
      label: 'text-sm',
      padding: 'px-4 py-2',
    },
    lg: {
      icon: 'h-6 w-6',
      text: 'text-2xl',
      label: 'text-base',
      padding: 'px-5 py-3',
    },
  }

  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full border border-orange-500/20',
        config.padding,
        className
      )}
    >
      <Flame
        className={cn(
          config.icon,
          streak > 0 ? 'text-orange-500' : 'text-muted-foreground'
        )}
      />
      <span className={cn('font-bold text-orange-500', config.text)}>
        {streak}
      </span>
      <span className={cn('text-muted-foreground', config.label)}>{label}</span>
    </div>
  )
}

interface StreakCalendarProps {
  days: { date: string; completed: boolean }[]
  className?: string
}

export function StreakCalendar({ days, className }: StreakCalendarProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {days.map((day) => {
        const date = new Date(day.date)
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'narrow' })

        return (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1"
            title={date.toLocaleDateString('pt-BR')}
          >
            <span className="text-xs text-muted-foreground">{dayName}</span>
            <div
              className={cn(
                'h-6 w-6 rounded-md flex items-center justify-center text-sm',
                day.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {day.completed ? '✓' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

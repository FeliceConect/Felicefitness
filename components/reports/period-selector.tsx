'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { ReportPeriod } from '@/types/reports'
import { getWeekDateRange } from '@/lib/reports'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PeriodSelectorProps {
  period: ReportPeriod
  onPeriodChange: (period: ReportPeriod) => void
  className?: string
}

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: '3months', label: '3 Meses' },
  { value: '6months', label: '6 Meses' },
  { value: 'year', label: 'Ano' },
  { value: 'all', label: 'Tudo' }
]

export function PeriodSelector({
  period,
  onPeriodChange,
  className
}: PeriodSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}>
      {periodOptions.map((option) => (
        <Button
          key={option.value}
          variant={period === option.value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onPeriodChange(option.value)}
          className={cn(
            'px-3 h-8',
            period === option.value && 'bg-background shadow-sm'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

// Navigation variant for week/month reports
interface PeriodNavigatorProps {
  label: string
  onPrevious: () => void
  onNext: () => void
  canGoNext?: boolean
  className?: string
}

export function PeriodNavigator({
  label,
  onPrevious,
  onNext,
  canGoNext = true,
  className
}: PeriodNavigatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="icon" onClick={onPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg min-w-[140px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Week picker
interface WeekPickerProps {
  week: number
  year: number
  onWeekChange: (week: number, year: number) => void
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export function WeekPicker({
  week,
  year,
  onPrevious,
  onNext,
  className
}: WeekPickerProps) {
  const isCurrentWeek = () => {
    const now = new Date()
    const currentWeek = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000
    )
    return week === currentWeek && year === now.getFullYear()
  }

  // Get the date range for this week and format it
  const dateRange = getWeekDateRange(week, year)
  const startFormatted = format(dateRange.start, "dd/MM", { locale: ptBR })
  const endFormatted = format(dateRange.end, "dd/MM", { locale: ptBR })
  const label = `${startFormatted} - ${endFormatted}`

  return (
    <PeriodNavigator
      label={label}
      onPrevious={onPrevious}
      onNext={onNext}
      canGoNext={!isCurrentWeek()}
      className={className}
    />
  )
}

// Month picker
interface MonthPickerProps {
  month: number
  year: number
  onMonthChange: (month: number, year: number) => void
  onPrevious: () => void
  onNext: () => void
  className?: string
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function MonthPicker({
  month,
  year,
  onPrevious,
  onNext,
  className
}: MonthPickerProps) {
  const isCurrentMonth = () => {
    const now = new Date()
    return month === now.getMonth() + 1 && year === now.getFullYear()
  }

  return (
    <PeriodNavigator
      label={`${monthNames[month - 1]} ${year}`}
      onPrevious={onPrevious}
      onNext={onNext}
      canGoNext={!isCurrentMonth()}
      className={className}
    />
  )
}

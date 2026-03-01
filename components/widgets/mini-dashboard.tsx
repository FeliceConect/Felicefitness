'use client'

import { cn } from '@/lib/utils'
import { WidgetDailyProgress } from './widget-daily-progress'
import { WidgetWater } from './widget-water'
import { WidgetWorkout } from './widget-workout'
import { WidgetStreak } from './widget-streak'
import { WidgetMacros } from './widget-macros'
import { WidgetGoals } from './widget-goals'
import type { WidgetConfig, WidgetType } from '@/types/widgets'

interface MiniDashboardProps {
  widgets: WidgetConfig[]
  data: Record<string, unknown>
  onWidgetClick?: (type: WidgetType) => void
  onAction?: (action: string, params?: Record<string, unknown>) => void
  className?: string
}

export function MiniDashboard({
  widgets,
  data,
  onWidgetClick,
  onAction,
  className,
}: MiniDashboardProps) {
  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order)

  const renderWidget = (config: WidgetConfig) => {
    const handleClick = () => onWidgetClick?.(config.type)

    switch (config.type) {
      case 'daily-progress':
        return (
          <WidgetDailyProgress
            key={config.id}
            size={config.size}
            data={data.dailyProgress as never}
            onClick={handleClick}
          />
        )

      case 'water':
        return (
          <WidgetWater
            key={config.id}
            size={config.size}
            data={data.water as never}
            onAdd={(amount) => onAction?.('add-water', { amount })}
          />
        )

      case 'workout':
        return (
          <WidgetWorkout
            key={config.id}
            size={config.size}
            data={data.workout as never}
            onStart={() => onAction?.('start-workout')}
            onClick={handleClick}
          />
        )

      case 'streak':
        return (
          <WidgetStreak
            key={config.id}
            size={config.size}
            data={data.streak as never}
            onClick={handleClick}
          />
        )

      case 'macros':
        return (
          <WidgetMacros
            key={config.id}
            size={config.size}
            data={data.macros as never}
            onClick={handleClick}
          />
        )

      case 'goals':
        return (
          <WidgetGoals
            key={config.id}
            size={config.size}
            data={data.goals as never}
            onClick={handleClick}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {enabledWidgets.map((widget) => (
        <div
          key={widget.id}
          className={cn(
            widget.size === 'large' && 'col-span-2',
            widget.size === 'small' && 'col-span-1'
          )}
        >
          {renderWidget(widget)}
        </div>
      ))}
    </div>
  )
}

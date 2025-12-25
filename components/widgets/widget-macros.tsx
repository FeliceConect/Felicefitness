'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Utensils } from 'lucide-react'
import type { WidgetSize, MacrosWidgetData } from '@/types/widgets'

interface WidgetMacrosProps {
  size: WidgetSize
  data: MacrosWidgetData
  onClick?: () => void
}

export function WidgetMacros({ size, data, onClick }: WidgetMacrosProps) {
  const { protein, carbs, fat, calories } = data

  const macros = [
    {
      name: 'Proteina',
      current: protein.current,
      goal: protein.goal,
      color: 'bg-red-500',
      textColor: 'text-red-400',
      percentage: Math.min(100, (protein.current / protein.goal) * 100),
    },
    {
      name: 'Carboidratos',
      current: carbs.current,
      goal: carbs.goal,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      percentage: Math.min(100, (carbs.current / carbs.goal) * 100),
    },
    {
      name: 'Gordura',
      current: fat.current,
      goal: fat.goal,
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      percentage: Math.min(100, (fat.current / fat.goal) * 100),
    },
  ]

  const caloriesPercentage = Math.min(100, (calories.current / calories.goal) * 100)

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Utensils className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-purple-400">{Math.round(caloriesPercentage)}%</span>
          </div>
          <div className="flex gap-1 h-2">
            {macros.map((macro) => (
              <div key={macro.name} className="flex-1 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', macro.color)}
                  style={{ width: `${macro.percentage}%` }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {calories.current} / {calories.goal} kcal
          </p>
        </div>
      </Card>
    )
  }

  // Medium size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Macros
            </span>
          </div>
          <span className="text-sm font-medium">
            <span className="text-foreground">{calories.current}</span>
            <span className="text-muted-foreground"> / {calories.goal} kcal</span>
          </span>
        </div>

        <div className="space-y-3">
          {macros.map((macro) => (
            <div key={macro.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={macro.textColor}>{macro.name}</span>
                <span className="text-muted-foreground">
                  {macro.current}g / {macro.goal}g
                </span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', macro.color)}
                  style={{ width: `${macro.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex justify-between pt-2 border-t border-border/30">
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">{protein.current}g</p>
            <p className="text-xs text-muted-foreground">Proteina</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-400">{carbs.current}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{fat.current}g</p>
            <p className="text-xs text-muted-foreground">Gordura</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

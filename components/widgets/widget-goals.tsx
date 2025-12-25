'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Target, TrendingUp, Calendar } from 'lucide-react'
import type { WidgetSize, GoalsWidgetData } from '@/types/widgets'

interface WidgetGoalsProps {
  size: WidgetSize
  data: GoalsWidgetData
  onClick?: () => void
}

export function WidgetGoals({ size, data, onClick }: WidgetGoalsProps) {
  const { goals } = data

  const formatDeadline = (date?: Date) => {
    if (!date) return null
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Vencido'
    if (diff === 0) return 'Hoje'
    if (diff === 1) return 'Amanha'
    if (diff < 7) return `${diff} dias`
    if (diff < 30) return `${Math.ceil(diff / 7)} semanas`
    return `${Math.ceil(diff / 30)} meses`
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (size === 'medium') {
    const topGoals = goals.slice(0, 3)

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
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Metas
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{goals.length} metas</span>
          </div>

          <div className="space-y-3">
            {topGoals.map((goal) => {
              const percentage = Math.min(100, (goal.current / goal.target) * 100)
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate flex-1">{goal.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', getProgressColor(percentage))}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {goal.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDeadline(goal.deadline)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // Large size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-5 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              Metas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">
              {goals.filter((g) => (g.current / g.target) >= 1).length} concluidas
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = Math.min(100, (goal.current / goal.target) * 100)
            const isCompleted = percentage >= 100

            return (
              <div
                key={goal.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  isCompleted
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/10 border-border/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('font-medium', isCompleted && 'text-green-400')}>
                    {goal.name}
                  </span>
                  {isCompleted && <span className="text-green-400">✓</span>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', getProgressColor(percentage))}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium min-w-[80px] text-right">
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Prazo: {formatDeadline(goal.deadline)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

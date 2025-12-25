'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Activity, TrendingUp } from 'lucide-react'
import type { WidgetSize, RecoveryWidgetData } from '@/types/widgets'

interface WidgetRecoveryProps {
  size: WidgetSize
  data: RecoveryWidgetData
  onClick?: () => void
}

export function WidgetRecovery({ size, data, onClick }: WidgetRecoveryProps) {
  const { score, muscleGroups, suggestion } = data

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBgColor = () => {
    if (score >= 80) return 'bg-green-500/20'
    if (score >= 60) return 'bg-yellow-500/20'
    if (score >= 40) return 'bg-orange-500/20'
    return 'bg-red-500/20'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recovered':
        return 'bg-green-500'
      case 'recovering':
        return 'bg-yellow-500'
      case 'fatigued':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getScoreBgColor())}>
            <Activity className={cn('w-5 h-5', getScoreColor())} />
          </div>
          <div>
            <p className={cn('text-lg font-bold', getScoreColor())}>{score}%</p>
            <p className="text-xs text-muted-foreground">Recuperacao</p>
          </div>
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
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Recuperacao
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={cn('w-4 h-4', getScoreColor())} />
            <span className={cn('text-sm font-bold', getScoreColor())}>{score}%</span>
          </div>
        </div>

        {/* Recovery bar */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/30 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fadigado</span>
            <span>Recuperado</span>
          </div>
        </div>

        {/* Muscle groups */}
        <div className="grid grid-cols-2 gap-2">
          {muscleGroups.slice(0, 4).map((group) => (
            <div
              key={group.name}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/10"
            >
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(group.status))} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground">{group.percentage}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion */}
        {suggestion && (
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
            <p className="text-xs text-purple-300">{suggestion}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Insight } from '@/types/reports'

function getInsightColor(type: string): string {
  switch (type) {
    case 'positive': return 'text-green-400'
    case 'negative': return 'text-red-400'
    case 'warning': return 'text-yellow-400'
    default: return 'text-blue-400'
  }
}

function getInsightBgColor(type: string): string {
  switch (type) {
    case 'positive': return 'bg-green-500/10'
    case 'negative': return 'bg-red-500/10'
    case 'warning': return 'bg-yellow-500/10'
    default: return 'bg-blue-500/10'
  }
}

interface InsightCardProps {
  insight: Insight
  compact?: boolean
  className?: string
  onClick?: () => void
}

export function InsightCard({
  insight,
  compact = false,
  className,
  onClick
}: InsightCardProps) {
  const textColor = getInsightColor(insight.type)
  const bgColor = getInsightBgColor(insight.type)

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors',
          bgColor,
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
      >
        <span className="text-2xl">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium truncate', textColor)}>{insight.title}</p>
          <p className="text-xs text-muted-foreground truncate">{insight.description}</p>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('h-1', bgColor.replace('/10', ''))} />
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{insight.icon}</span>
          <div className="flex-1">
            <h4 className={cn('font-semibold', textColor)}>{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            {insight.change !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                Variação: {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Insight list component
interface InsightListProps {
  insights: Insight[]
  compact?: boolean
  maxItems?: number
  className?: string
}

export function InsightList({
  insights,
  compact = true,
  maxItems,
  className
}: InsightListProps) {
  const displayInsights = maxItems ? insights.slice(0, maxItems) : insights

  if (displayInsights.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-8', className)}>
        <p>Nenhum insight disponível</p>
        <p className="text-sm">Continue registrando suas atividades!</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayInsights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} compact={compact} />
      ))}
    </div>
  )
}

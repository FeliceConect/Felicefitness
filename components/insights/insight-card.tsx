'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, Clock } from 'lucide-react'
import type { Insight } from '@/types/insights'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface InsightCardProps {
  insight: Insight
  onDismiss?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  compact?: boolean
}

const priorityColors = {
  critical: 'border-l-red-500 bg-red-500/5',
  high: 'border-l-orange-500 bg-orange-500/5',
  medium: 'border-l-yellow-500 bg-yellow-500/5',
  low: 'border-l-blue-500 bg-blue-500/5',
}

const priorityBadges = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

const typeIcons: Record<string, string> = {
  achievement: '🏆',
  pattern: '🔍',
  trend: '📊',
  alert: '⚠️',
  recommendation: '💡',
  prediction: '🔮',
  optimization: '⚡',
  correlation: '🔗',
  milestone: '🎯',
  anomaly: '❗',
}

export function InsightCard({
  insight,
  onDismiss,
  onMarkAsRead,
  compact = false,
}: InsightCardProps) {
  const handleClick = () => {
    if (!insight.viewed && onMarkAsRead) {
      onMarkAsRead(insight.id)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDismiss) {
      onDismiss(insight.id)
    }
  }

  const timeAgo = getTimeAgo(insight.createdAt)

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border-l-4 transition-colors',
          priorityColors[insight.priority],
          !insight.viewed && 'ring-1 ring-primary/20'
        )}
        onClick={handleClick}
      >
        <span className="text-xl">{insight.icon || typeIcons[insight.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{insight.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {insight.description}
          </p>
        </div>
        {insight.action?.href && (
          <Link href={insight.action.href}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-md',
        priorityColors[insight.priority],
        !insight.viewed && 'ring-1 ring-primary/20'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{insight.icon || typeIcons[insight.type]}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  priorityBadges[insight.priority]
                )}
              >
                {insight.priority === 'critical'
                  ? 'CRÍTICO'
                  : insight.priority === 'high'
                    ? 'ALTO'
                    : insight.priority === 'medium'
                      ? 'MÉDIO'
                      : 'BAIXO'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>

            <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>

            {insight.action && (
              <div className="mt-3">
                {insight.action.href ? (
                  <Link href={insight.action.href}>
                    <Button size="sm" variant="outline" className="h-8">
                      {insight.action.label}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline" className="h-8">
                    {insight.action.label}
                  </Button>
                )}
              </div>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('pt-BR')
}

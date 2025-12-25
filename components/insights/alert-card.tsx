'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Clock, Bell } from 'lucide-react'
import type { Insight } from '@/types/insights'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AlertCardProps {
  alert: Insight
  onResolve?: (id: string) => void
  onSnooze?: (id: string, hours: number) => void
}

const priorityStyles = {
  critical: {
    border: 'border-l-4 border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    icon: '🔴',
  },
  high: {
    border: 'border-l-4 border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    icon: '🟠',
  },
  medium: {
    border: 'border-l-4 border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    icon: '🟡',
  },
  low: {
    border: 'border-l-4 border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    icon: '🔵',
  },
}

export function AlertCard({ alert, onResolve, onSnooze }: AlertCardProps) {
  const style = priorityStyles[alert.priority]

  return (
    <Card className={cn(style.border, style.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">{style.icon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                {alert.priority === 'critical'
                  ? 'CRÍTICO'
                  : alert.priority === 'high'
                    ? 'ALTO'
                    : alert.priority === 'medium'
                      ? 'MÉDIO'
                      : 'BAIXO'}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-lg">{alert.icon}</span>
              <div>
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {alert.action?.href && (
                <Link href={alert.action.href}>
                  <Button size="sm" variant="default" className="h-8">
                    {alert.action.label}
                  </Button>
                </Link>
              )}

              {onSnooze && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => onSnooze(alert.id, 24)}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Lembrar amanhã
                </Button>
              )}

              {onResolve && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => onResolve(alert.id)}
                >
                  Resolver
                </Button>
              )}
            </div>
          </div>

          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertBannerProps {
  alert: Insight
  onAction?: () => void
  onDismiss?: () => void
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  void alert.priority // use priority via className directly

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-3',
        alert.priority === 'critical' ? 'bg-red-500' : 'bg-orange-500',
        'text-white shadow-lg'
      )}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bell className="w-5 h-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{alert.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {alert.action?.href && (
            <Link href={alert.action.href}>
              <Button size="sm" variant="secondary" className="h-7 text-xs">
                {alert.action.label}
              </Button>
            </Link>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

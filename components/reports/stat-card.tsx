'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Trend } from '@/types/reports'
import { TrendIndicator } from './trend-indicator'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: Trend
  higherIsBetter?: boolean
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  higherIsBetter = true,
  className,
  onClick
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {trend && (
            <TrendIndicator trend={trend} higherIsBetter={higherIsBetter} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact variant
interface CompactStatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
  className?: string
}

export function CompactStatCard({
  label,
  value,
  icon,
  color,
  className
}: CompactStatCardProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/50', className)}>
      {icon && (
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: color ? `${color}20` : undefined }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  )
}

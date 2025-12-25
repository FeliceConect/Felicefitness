'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Trend } from '@/types/reports'
import { TrendIndicator } from './trend-indicator'

interface ComparisonMetric {
  label: string
  currentValue: number | string
  previousValue: number | string
  trend: Trend
  higherIsBetter?: boolean
  formatter?: (value: number | string) => string
}

interface ComparisonCardProps {
  title: string
  metrics: ComparisonMetric[]
  className?: string
}

export function ComparisonCard({
  title,
  metrics,
  className
}: ComparisonCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold">
                    {metric.formatter
                      ? metric.formatter(metric.currentValue)
                      : metric.currentValue}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    vs {metric.formatter
                      ? metric.formatter(metric.previousValue)
                      : metric.previousValue}
                  </span>
                </div>
              </div>
              <TrendIndicator
                trend={metric.trend}
                higherIsBetter={metric.higherIsBetter ?? true}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Simple comparison row
interface ComparisonRowProps {
  label: string
  value1: number | string
  value2: number | string
  value1Label?: string
  value2Label?: string
  highlight?: 1 | 2 | null
  className?: string
}

export function ComparisonRow({
  label,
  value1,
  value2,
  value1Label,
  value2Label,
  highlight,
  className
}: ComparisonRowProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4 py-3 border-b last:border-0', className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn(
        'text-center font-medium',
        highlight === 1 && 'text-green-500'
      )}>
        {value1}
        {value1Label && <span className="text-xs text-muted-foreground ml-1">{value1Label}</span>}
      </div>
      <div className={cn(
        'text-center font-medium',
        highlight === 2 && 'text-green-500'
      )}>
        {value2}
        {value2Label && <span className="text-xs text-muted-foreground ml-1">{value2Label}</span>}
      </div>
    </div>
  )
}

// Full comparison table
interface ComparisonTableProps {
  period1Label: string
  period2Label: string
  rows: {
    label: string
    value1: number | string
    value2: number | string
    better: 1 | 2 | null
    formatter?: (v: number | string) => string
  }[]
  className?: string
}

export function ComparisonTable({
  period1Label,
  period2Label,
  rows,
  className
}: ComparisonTableProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 pb-2 border-b">
        <div className="text-sm font-medium text-muted-foreground">Métrica</div>
        <div className="text-center text-sm font-medium">{period1Label}</div>
        <div className="text-center text-sm font-medium">{period2Label}</div>
      </div>

      {/* Rows */}
      {rows.map((row, index) => (
        <ComparisonRow
          key={index}
          label={row.label}
          value1={row.formatter ? row.formatter(row.value1) : row.value1}
          value2={row.formatter ? row.formatter(row.value2) : row.value2}
          highlight={row.better}
        />
      ))}
    </div>
  )
}

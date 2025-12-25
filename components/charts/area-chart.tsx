'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  date: string
  value: number
  label?: string
}

interface AreaChartProps {
  data: DataPoint[]
  color?: string
  gradientFrom?: string
  gradientTo?: string
  showGrid?: boolean
  height?: number
  className?: string
  valueFormatter?: (value: number) => string
  dateFormatter?: (date: string) => string
}

export function AreaChart({
  data,
  color = '#8b5cf6',
  gradientFrom,
  gradientTo,
  showGrid = false,
  height = 200,
  className,
  valueFormatter = (v) => v.toString(),
  dateFormatter = (d) => d
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ height }}>
        Sem dados para exibir
      </div>
    )
  }

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientFrom || color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={gradientTo || color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          )}
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={valueFormatter}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DataPoint
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                    <p className="text-muted-foreground">{item.label || dateFormatter(item.date)}</p>
                    <p className="font-semibold" style={{ color }}>
                      {valueFormatter(item.value)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}

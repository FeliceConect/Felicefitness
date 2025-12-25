'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  date: string
  value: number
  label?: string
}

interface LineChartProps {
  data: DataPoint[]
  color?: string
  showGrid?: boolean
  showArea?: boolean
  goalValue?: number
  goalLabel?: string
  height?: number
  className?: string
  valueFormatter?: (value: number) => string
  dateFormatter?: (date: string) => string
}

export function LineChart({
  data,
  color = '#8b5cf6',
  showGrid = true,
  showArea = false,
  goalValue,
  goalLabel,
  height = 200,
  className,
  valueFormatter = (v) => v.toString(),
  dateFormatter = (d) => d
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ height }}>
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
          {goalValue && (
            <ReferenceLine
              y={goalValue}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: goalLabel || `Meta: ${valueFormatter(goalValue)}`,
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 3 }}
            activeDot={{ fill: color, strokeWidth: 0, r: 5 }}
            fill={showArea ? `${color}20` : 'none'}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

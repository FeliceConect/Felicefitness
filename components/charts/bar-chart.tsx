'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  color?: string
  showGrid?: boolean
  horizontal?: boolean
  goalValue?: number
  height?: number
  className?: string
  valueFormatter?: (value: number) => string
  barSize?: number
}

export function BarChart({
  data,
  color = '#8b5cf6',
  showGrid = true,
  horizontal = false,
  goalValue,
  height = 200,
  className,
  valueFormatter = (v) => v.toString(),
  barSize = 24
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ height }}>
        Sem dados para exibir
      </div>
    )
  }

  const layout = horizontal ? 'vertical' : 'horizontal'

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 5, left: horizontal ? 50 : -20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          )}
          {horizontal ? (
            <>
              <XAxis type="number" tickFormatter={valueFormatter} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={valueFormatter} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DataPoint
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-semibold" style={{ color: item.color || color }}>
                      {valueFormatter(item.value)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          {goalValue && !horizontal && (
            <ReferenceLine
              y={goalValue}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
            />
          )}
          <Bar dataKey="value" barSize={barSize} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

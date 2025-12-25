'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface PieChartProps {
  data: DataPoint[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
  showLabels?: boolean
  className?: string
  valueFormatter?: (value: number) => string
}

export function PieChart({
  data,
  height = 200,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showLabels = false,
  className,
  valueFormatter = (v) => v.toString()
}: PieChartProps) {
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
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={showLabels ? ({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%` : false}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DataPoint
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                    <p className="text-muted-foreground">{item.name}</p>
                    <p className="font-semibold" style={{ color: item.color }}>
                      {valueFormatter(item.value)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Donut variant
export function DonutChart(props: PieChartProps) {
  return <PieChart {...props} innerRadius={50} outerRadius={80} />
}

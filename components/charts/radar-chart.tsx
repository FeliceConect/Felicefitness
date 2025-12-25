'use client'

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { cn } from '@/lib/utils'

interface DataPoint {
  metric: string
  value: number
  fullMark?: number
}

interface ComparisonDataPoint {
  metric: string
  current: number
  previous: number
  fullMark?: number
}

interface RadarChartProps {
  data: DataPoint[] | ComparisonDataPoint[]
  showComparison?: boolean
  currentColor?: string
  previousColor?: string
  currentLabel?: string
  previousLabel?: string
  height?: number
  className?: string
}

export function RadarChart({
  data,
  showComparison = false,
  currentColor = '#8b5cf6',
  previousColor = '#94a3b8',
  currentLabel = 'Atual',
  previousLabel = 'Anterior',
  height = 300,
  className
}: RadarChartProps) {
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
        <RechartsRadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <PolarRadiusAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            axisLine={false}
          />
          {showComparison ? (
            <>
              <Radar
                name={previousLabel}
                dataKey="previous"
                stroke={previousColor}
                fill={previousColor}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name={currentLabel}
                dataKey="current"
                stroke={currentColor}
                fill={currentColor}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
            </>
          ) : (
            <Radar
              dataKey="value"
              stroke={currentColor}
              fill={currentColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExerciseChartProps {
  data: Array<{
    date: string
    weight: number
    reps: number
    volume: number
    isPR: boolean
  }>
  metric: 'weight' | 'volume' | 'reps'
}

const metricLabels: Record<string, { label: string; color: string; unit: string }> = {
  weight: { label: 'Carga Máxima', color: '#c29863', unit: 'kg' },
  volume: { label: 'Volume Total', color: '#663739', unit: 'kg' },
  reps: { label: 'Repetições', color: '#10B981', unit: '' }
}

export function ExerciseChart({ data, metric }: ExerciseChartProps) {
  const metricInfo = metricLabels[metric]

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      dateLabel: format(new Date(d.date), 'd/MM', { locale: ptBR }),
      value: d[metric]
    }))
  }, [data, metric])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-foreground-secondary mb-1">
            {format(new Date(data.date), "d 'de' MMM", { locale: ptBR })}
          </p>
          <p className="text-lg font-bold text-foreground">
            {data.value}{metricInfo.unit}
          </p>
          {data.isPR && (
            <p className="text-xs text-amber-400 mt-1">🏆 Recorde Pessoal</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metricInfo.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={metricInfo.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#ae9b89', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#ae9b89', fontSize: 12 }}
            dx={-10}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={metricInfo.color}
            strokeWidth={2}
            fill={`url(#gradient-${metric})`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => {
              const { cx, cy, payload } = props
              if (payload.isPR) {
                return (
                  <g key={`dot-${cx}-${cy}`}>
                    <circle cx={cx} cy={cy} r={6} fill="#F59E0B" stroke="#FCD34D" strokeWidth={2} />
                    <text x={cx} y={cy - 10} textAnchor="middle" fill="#F59E0B" fontSize={10}>🏆</text>
                  </g>
                )
              }
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={metricInfo.color} />
            }}
            activeDot={{ r: 6, fill: metricInfo.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

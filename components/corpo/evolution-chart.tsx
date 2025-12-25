"use client"

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BodyHistoryPoint } from '@/lib/body/types'
import { cn } from '@/lib/utils'

interface EvolutionChartProps {
  data: BodyHistoryPoint[]
  className?: string
}

type MetricKey = 'peso' | 'gordura_percentual' | 'massa_muscular' | 'score'

const metrics: { key: MetricKey; label: string; color: string; unidade: string }[] = [
  { key: 'peso', label: 'Peso', color: '#8B5CF6', unidade: 'kg' },
  { key: 'gordura_percentual', label: 'Gordura', color: '#F59E0B', unidade: '%' },
  { key: 'massa_muscular', label: 'Músculo', color: '#10B981', unidade: 'kg' },
  { key: 'score', label: 'Score', color: '#06B6D4', unidade: '' }
]

export function EvolutionChart({ data, className }: EvolutionChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('peso')

  const chartData = useMemo(() => {
    const metric = metrics.find(m => m.key === selectedMetric)!
    const values = data.map(d => d[selectedMetric])
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    // Adicionar margem de 10%
    const padding = range * 0.1
    const adjustedMin = minVal - padding
    const adjustedMax = maxVal + padding

    return {
      metric,
      points: data.map((d, i) => ({
        x: (i / (data.length - 1 || 1)) * 100,
        y: ((d[selectedMetric] - adjustedMin) / (adjustedMax - adjustedMin || 1)) * 100,
        value: d[selectedMetric],
        date: d.data
      })),
      minVal: adjustedMin,
      maxVal: adjustedMax
    }
  }, [data, selectedMetric])

  // Criar path SVG para a linha
  const linePath = useMemo(() => {
    if (chartData.points.length === 0) return ''

    return chartData.points.reduce((path, point, i) => {
      const x = point.x
      const y = 100 - point.y // Inverter Y pois SVG tem origem no topo
      if (i === 0) return `M ${x} ${y}`
      return `${path} L ${x} ${y}`
    }, '')
  }, [chartData.points])

  // Path para área preenchida
  const areaPath = useMemo(() => {
    if (chartData.points.length === 0) return ''
    return `${linePath} L 100 100 L 0 100 Z`
  }, [linePath, chartData.points])

  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Evolução
      </h3>

      {/* Metric selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {metrics.map(metric => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              selectedMetric === metric.key
                ? 'text-white'
                : 'text-slate-400 hover:text-white bg-[#1E1E2E]'
            )}
            style={selectedMetric === metric.key ? {
              backgroundColor: `${metric.color}20`,
              color: metric.color
            } : undefined}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[10px] text-slate-500">
          <span>{chartData.maxVal.toFixed(1)}</span>
          <span>{((chartData.maxVal + chartData.minVal) / 2).toFixed(1)}</span>
          <span>{chartData.minVal.toFixed(1)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-t border-[#2E2E3E]" />
            ))}
          </div>

          {/* SVG Chart */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`gradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={chartData.metric.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={chartData.metric.color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={areaPath}
              fill={`url(#gradient-${selectedMetric})`}
            />

            {/* Line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              d={linePath}
              fill="none"
              stroke={chartData.metric.color}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: '2px' }}
            />

            {/* Data points */}
            {chartData.points.map((point, i) => (
              <motion.circle
                key={i}
                initial={{ r: 0 }}
                animate={{ r: 1.5 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                cx={point.x}
                cy={100 - point.y}
                fill={chartData.metric.color}
                style={{ r: '4px' }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* X-axis labels (dates) */}
      <div className="ml-12 mt-2 flex justify-between text-[10px] text-slate-500">
        {data.length > 0 && (
          <>
            <span>{format(parseISO(data[0].data), 'MMM/yy', { locale: ptBR })}</span>
            {data.length > 2 && (
              <span>{format(parseISO(data[Math.floor(data.length / 2)].data), 'MMM/yy', { locale: ptBR })}</span>
            )}
            <span>{format(parseISO(data[data.length - 1].data), 'MMM/yy', { locale: ptBR })}</span>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[#2E2E3E] flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500">Valor inicial</p>
          <p className="text-white font-semibold">
            {data[0]?.[selectedMetric].toFixed(1)}{chartData.metric.unidade}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Variação</p>
          <p
            className="font-semibold"
            style={{ color: chartData.metric.color }}
          >
            {data.length > 1 ? (
              <>
                {(data[data.length - 1][selectedMetric] - data[0][selectedMetric]) >= 0 ? '+' : ''}
                {(data[data.length - 1][selectedMetric] - data[0][selectedMetric]).toFixed(1)}
                {chartData.metric.unidade}
              </>
            ) : '--'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Valor atual</p>
          <p className="text-white font-semibold">
            {data[data.length - 1]?.[selectedMetric].toFixed(1)}{chartData.metric.unidade}
          </p>
        </div>
      </div>
    </div>
  )
}

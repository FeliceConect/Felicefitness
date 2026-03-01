"use client"

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MeasurementComparison as MeasurementComparisonType } from '@/lib/body/types'
import { cn } from '@/lib/utils'

interface MeasurementComparisonProps {
  comparison: MeasurementComparisonType
  title?: string
  className?: string
}

interface ComparisonRow {
  label: string
  diff: number
  unidade: string
  inverso?: boolean // Se true, diminuir é bom
}

export function MeasurementComparison({
  comparison,
  title = 'Comparação',
  className
}: MeasurementComparisonProps) {
  const { medicao_anterior, medicao_atual, diferencas } = comparison

  const rows: ComparisonRow[] = [
    { label: 'Peso', diff: diferencas.peso, unidade: 'kg', inverso: true },
    { label: 'Gordura', diff: diferencas.gordura_kg, unidade: 'kg', inverso: true },
    { label: 'Gordura %', diff: diferencas.gordura_percentual, unidade: '%', inverso: true },
    { label: 'Músculo', diff: diferencas.musculo_kg, unidade: 'kg' },
    { label: 'Água', diff: diferencas.agua, unidade: 'L' },
    { label: 'Score', diff: diferencas.score, unidade: 'pts' }
  ]

  const getTrendIcon = (diff: number, inverso: boolean) => {
    if (Math.abs(diff) < 0.1) return Minus
    const isPositive = inverso ? diff < 0 : diff > 0
    return isPositive ? TrendingUp : TrendingDown
  }

  const getTrendColor = (diff: number, inverso: boolean) => {
    if (Math.abs(diff) < 0.1) return '#64748B' // slate
    const isPositive = inverso ? diff < 0 : diff > 0
    return isPositive ? '#10B981' : '#EF4444' // emerald / red
  }

  const formatDiff = (diff: number, unidade: string) => {
    const sign = diff >= 0 ? '+' : ''
    const decimals = unidade === 'pts' ? 0 : 1
    return `${sign}${diff.toFixed(decimals)}${unidade}`
  }

  return (
    <div className={cn('bg-white border border-border rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-foreground-muted">
          <Calendar className="w-3 h-3" />
          <span>{diferencas.dias_entre} dias</span>
        </div>
      </div>

      {/* Date headers */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-foreground-muted">
        <div className="text-left">
          {format(parseISO(medicao_anterior.data), "d MMM''yy", { locale: ptBR })}
        </div>
        <div className="text-center">Variação</div>
        <div className="text-right">
          {format(parseISO(medicao_atual.data), "d MMM''yy", { locale: ptBR })}
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-2">
        {rows.map((row, index) => {
          const Icon = getTrendIcon(row.diff, row.inverso || false)
          const color = getTrendColor(row.diff, row.inverso || false)

          // Get values based on label
          let valorAnterior = 0
          let valorAtual = 0

          switch (row.label) {
            case 'Peso':
              valorAnterior = medicao_anterior.peso
              valorAtual = medicao_atual.peso
              break
            case 'Gordura':
              valorAnterior = medicao_anterior.musculo_gordura.massa_gordura_corporal
              valorAtual = medicao_atual.musculo_gordura.massa_gordura_corporal
              break
            case 'Gordura %':
              valorAnterior = medicao_anterior.musculo_gordura.percentual_gordura
              valorAtual = medicao_atual.musculo_gordura.percentual_gordura
              break
            case 'Músculo':
              valorAnterior = medicao_anterior.musculo_gordura.massa_muscular_esqueletica
              valorAtual = medicao_atual.musculo_gordura.massa_muscular_esqueletica
              break
            case 'Água':
              valorAnterior = medicao_anterior.composicao.agua_total
              valorAtual = medicao_atual.composicao.agua_total
              break
            case 'Score':
              valorAnterior = medicao_anterior.score.pontuacao
              valorAtual = medicao_atual.score.pontuacao
              break
          }

          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="grid grid-cols-3 gap-2 items-center py-2 border-b border-border last:border-0"
            >
              {/* Previous value */}
              <div className="text-left">
                <p className="text-xs text-foreground-muted">{row.label}</p>
                <p className="text-sm text-foreground font-medium">
                  {valorAnterior.toFixed(row.unidade === 'pts' ? 0 : 1)}
                </p>
              </div>

              {/* Difference */}
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color
                  }}
                >
                  <Icon className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {formatDiff(row.diff, row.unidade)}
                  </span>
                </div>
              </div>

              {/* Current value */}
              <div className="text-right">
                <p className="text-xs text-foreground-muted">{row.label}</p>
                <p className="text-sm text-foreground font-medium">
                  {valorAtual.toFixed(row.unidade === 'pts' ? 0 : 1)}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { motion } from 'framer-motion'
import { evaluateMetric, REFERENCIAS_HOMEM_40_59 } from '@/lib/body/references'
import { cn } from '@/lib/utils'

interface MuscleFatAnalysisProps {
  peso: number
  massaMuscular: number
  massaGordura: number
  imc: number
  percentualGordura: number
  className?: string
}

interface BarData {
  label: string
  valor: number
  unidade: string
  faixaMin: number
  faixaMax: number
  idealMin: number
  idealMax: number
  inverso?: boolean
}

export function MuscleFatAnalysis({
  peso,
  massaMuscular,
  massaGordura,
  imc,
  percentualGordura,
  className
}: MuscleFatAnalysisProps) {
  const refs = REFERENCIAS_HOMEM_40_59

  const bars: BarData[] = [
    {
      label: 'Peso',
      valor: peso,
      unidade: 'kg',
      faixaMin: refs.peso.min,
      faixaMax: refs.peso.max,
      idealMin: refs.peso.ideal_min,
      idealMax: refs.peso.ideal_max
    },
    {
      label: 'Massa Muscular',
      valor: massaMuscular,
      unidade: 'kg',
      faixaMin: refs.massa_muscular_esqueletica.min,
      faixaMax: refs.massa_muscular_esqueletica.max,
      idealMin: refs.massa_muscular_esqueletica.ideal_min,
      idealMax: refs.massa_muscular_esqueletica.ideal_max
    },
    {
      label: 'Gordura',
      valor: massaGordura,
      unidade: 'kg',
      faixaMin: refs.massa_gordura_corporal.min,
      faixaMax: refs.massa_gordura_corporal.max,
      idealMin: refs.massa_gordura_corporal.ideal_min,
      idealMax: refs.massa_gordura_corporal.ideal_max,
      inverso: true
    }
  ]

  return (
    <div className={cn('bg-white border border-border rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-4">
        Análise Músculo-Gordura
      </h3>

      <div className="space-y-4">
        {bars.map((bar, index) => {
          const evaluation = evaluateMetric(
            bar.valor,
            {
              min: bar.faixaMin,
              max: bar.faixaMax,
              ideal_min: bar.idealMin,
              ideal_max: bar.idealMax,
              unit: bar.unidade
            },
            bar.inverso
          )

          // Calcular posição da barra (0-100%)
          const range = bar.faixaMax - bar.faixaMin
          const position = ((bar.valor - bar.faixaMin) / range) * 100
          const clampedPosition = Math.max(5, Math.min(95, position))

          // Posição da faixa ideal
          const idealStart = ((bar.idealMin - bar.faixaMin) / range) * 100
          const idealEnd = ((bar.idealMax - bar.faixaMin) / range) * 100

          // Cor baseada no status
          let barColor = '#10B981' // emerald - normal
          if (evaluation.status === 'baixo') barColor = '#F59E0B' // amber
          if (evaluation.status === 'alto') barColor = '#F59E0B' // amber
          if (evaluation.status === 'muito_alto') barColor = '#EF4444' // red

          return (
            <motion.div
              key={bar.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Label and value */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">{bar.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">
                    {bar.valor.toFixed(1)}{bar.unidade}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${barColor}20`,
                      color: barColor
                    }}
                  >
                    {evaluation.status === 'normal' ? 'Normal' :
                     evaluation.status === 'baixo' ? 'Baixo' :
                     evaluation.status === 'alto' ? 'Alto' : 'Muito Alto'}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-3 bg-background-elevated rounded-full overflow-hidden">
                {/* Ideal range indicator */}
                <div
                  className="absolute top-0 h-full bg-emerald-500/20 rounded-full"
                  style={{
                    left: `${idealStart}%`,
                    width: `${idealEnd - idealStart}%`
                  }}
                />

                {/* Current value indicator */}
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: `${clampedPosition}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: barColor }}
                  />
                </motion.div>
              </div>

              {/* Scale labels */}
              <div className="flex justify-between text-[10px] text-foreground-muted">
                <span>{bar.faixaMin}</span>
                <span className="text-foreground-muted">
                  Ideal: {bar.idealMin}-{bar.idealMax}
                </span>
                <span>{bar.faixaMax}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* IMC and Body Fat Summary */}
      <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-foreground-muted text-xs mb-1">IMC</p>
          <p className="text-xl font-bold text-foreground">{imc.toFixed(1)}</p>
          <p className="text-xs text-foreground-secondary">
            {imc < 18.5 ? 'Baixo peso' :
             imc < 25 ? 'Normal' :
             imc < 30 ? 'Sobrepeso' : 'Obesidade'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-foreground-muted text-xs mb-1">Gordura</p>
          <p className="text-xl font-bold text-foreground">{percentualGordura.toFixed(1)}%</p>
          <p className="text-xs text-foreground-secondary">
            {percentualGordura < 11 ? 'Atlético' :
             percentualGordura <= 21 ? 'Normal' :
             percentualGordura <= 28 ? 'Acima' : 'Alto'}
          </p>
        </div>
      </div>
    </div>
  )
}

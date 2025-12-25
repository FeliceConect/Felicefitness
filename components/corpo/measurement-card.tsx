"use client"

import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Scale } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { BodyCompositionMeasurement } from '@/lib/body/types'
import { getScoreColor, getScoreCategory } from '@/lib/body/references'
import { cn } from '@/lib/utils'

interface MeasurementCardProps {
  measurement: BodyCompositionMeasurement
  index?: number
  showCompare?: boolean
  previousMeasurement?: BodyCompositionMeasurement
  className?: string
}

export function MeasurementCard({
  measurement,
  index = 0,
  showCompare = false,
  previousMeasurement,
  className
}: MeasurementCardProps) {
  const scoreColor = getScoreColor(measurement.score.pontuacao)
  const categoria = getScoreCategory(measurement.score.pontuacao)

  const categoriaLabels: Record<typeof categoria, string> = {
    excelente: 'Excelente',
    bom: 'Bom',
    normal: 'Normal',
    abaixo_media: 'Abaixo',
    fraco: 'Fraco'
  }

  // Calculate diffs if previous measurement exists
  const diffs = previousMeasurement ? {
    peso: measurement.peso - previousMeasurement.peso,
    gordura: measurement.musculo_gordura.percentual_gordura - previousMeasurement.musculo_gordura.percentual_gordura,
    musculo: measurement.musculo_gordura.massa_muscular_esqueletica - previousMeasurement.musculo_gordura.massa_muscular_esqueletica
  } : null

  return (
    <Link href={`/corpo/medicao/${measurement.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4',
          'hover:border-violet-500/30 transition-colors cursor-pointer',
          className
        )}
      >
        <div className="flex items-start justify-between">
          {/* Left side - Date and metrics */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(parseISO(measurement.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Weight */}
              <div>
                <p className="text-xs text-slate-500">Peso</p>
                <p className="text-lg font-bold text-white">
                  {measurement.peso.toFixed(1)}
                  <span className="text-sm text-slate-400 ml-0.5">kg</span>
                </p>
                {showCompare && diffs && (
                  <p className={cn(
                    'text-xs',
                    diffs.peso < 0 ? 'text-emerald-400' : diffs.peso > 0 ? 'text-red-400' : 'text-slate-500'
                  )}>
                    {diffs.peso >= 0 ? '+' : ''}{diffs.peso.toFixed(1)}kg
                  </p>
                )}
              </div>

              {/* Body fat */}
              <div>
                <p className="text-xs text-slate-500">Gordura</p>
                <p className="text-lg font-bold text-white">
                  {measurement.musculo_gordura.percentual_gordura.toFixed(1)}
                  <span className="text-sm text-slate-400 ml-0.5">%</span>
                </p>
                {showCompare && diffs && (
                  <p className={cn(
                    'text-xs',
                    diffs.gordura < 0 ? 'text-emerald-400' : diffs.gordura > 0 ? 'text-red-400' : 'text-slate-500'
                  )}>
                    {diffs.gordura >= 0 ? '+' : ''}{diffs.gordura.toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Muscle */}
              <div>
                <p className="text-xs text-slate-500">Músculo</p>
                <p className="text-lg font-bold text-white">
                  {measurement.musculo_gordura.massa_muscular_esqueletica.toFixed(1)}
                  <span className="text-sm text-slate-400 ml-0.5">kg</span>
                </p>
                {showCompare && diffs && (
                  <p className={cn(
                    'text-xs',
                    diffs.musculo > 0 ? 'text-emerald-400' : diffs.musculo < 0 ? 'text-red-400' : 'text-slate-500'
                  )}>
                    {diffs.musculo >= 0 ? '+' : ''}{diffs.musculo.toFixed(1)}kg
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Score */}
          <div className="flex flex-col items-end">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1"
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor
              }}
            >
              {measurement.score.pontuacao}
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor
              }}
            >
              {categoriaLabels[categoria]}
            </span>
          </div>
        </div>

        {/* Source badge */}
        <div className="mt-3 pt-3 border-t border-[#2E2E3E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 capitalize">
              {measurement.fonte === 'inbody' ? 'InBody' :
               measurement.fonte === 'manual' ? 'Manual' : 'Balança Smart'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </motion.div>
    </Link>
  )
}

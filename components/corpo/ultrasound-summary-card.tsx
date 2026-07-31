'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Waves } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useUltrasoundAssessments } from '@/hooks/use-ultrasound-assessments'
import { formatarDelta, formatarMm } from '@/lib/usg/series'

/**
 * Cartão de entrada para a avaliação por ultrassom no hub de composição
 * corporal. Não renderiza nada quando o paciente ainda não tem avaliação —
 * a coleta é feita pela nutricionista, não pelo paciente.
 */
export function UltrasoundSummaryCard() {
  const { ultima, anterior, isLoading } = useUltrasoundAssessments()

  if (isLoading || !ultima) return null

  const delta =
    ultima.soma_gordura_mm != null && anterior?.soma_gordura_mm != null
      ? Number(ultima.soma_gordura_mm) - Number(anterior.soma_gordura_mm)
      : null

  return (
    <Link href="/corpo/ultrassom">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white border border-border rounded-xl p-4 flex items-center justify-between hover:border-dourado/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center shrink-0">
            <Waves className="w-5 h-5 text-dourado" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-medium">Avaliação por Ultrassom</p>
            <p className="text-sm text-foreground-secondary truncate">
              {format(parseISO(ultima.data), 'dd/MM')} ·{' '}
              {ultima.soma_gordura_mm === null
                ? 'soma indisponível'
                : `${formatarMm(ultima.soma_gordura_mm)} mm`}
              {delta !== null && (
                <span className={delta < 0 ? 'text-[#7dad6a]' : undefined}>
                  {' '}
                  {formatarDelta(delta)} mm
                </span>
              )}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-foreground-muted shrink-0" aria-hidden="true" />
      </motion.div>
    </Link>
  )
}

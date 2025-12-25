"use client"

import { motion } from 'framer-motion'
import type { SegmentalAnalysis as SegmentalAnalysisType } from '@/lib/body/types'
import { cn } from '@/lib/utils'

interface SegmentalAnalysisProps {
  data: SegmentalAnalysisType
  className?: string
}

export function SegmentalAnalysis({ data, className }: SegmentalAnalysisProps) {
  const getAvaliacaoColor = (avaliacao: 'baixo' | 'normal' | 'alto') => {
    switch (avaliacao) {
      case 'baixo': return '#F59E0B' // amber
      case 'normal': return '#10B981' // emerald
      case 'alto': return '#EF4444' // red
    }
  }

  const getAvaliacaoLabel = (avaliacao: 'baixo' | 'normal' | 'alto') => {
    switch (avaliacao) {
      case 'baixo': return 'Baixo'
      case 'normal': return 'Normal'
      case 'alto': return 'Alto'
    }
  }

  const segments = [
    { key: 'braco_esquerdo', label: 'Braço E', data: data.braco_esquerdo, position: { top: '20%', left: '15%' } },
    { key: 'braco_direito', label: 'Braço D', data: data.braco_direito, position: { top: '20%', right: '15%' } },
    { key: 'tronco', label: 'Tronco', data: data.tronco, position: { top: '40%', left: '50%', transform: 'translateX(-50%)' } },
    { key: 'perna_esquerda', label: 'Perna E', data: data.perna_esquerda, position: { bottom: '10%', left: '25%' } },
    { key: 'perna_direita', label: 'Perna D', data: data.perna_direita, position: { bottom: '10%', right: '25%' } }
  ]

  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Análise Segmentar
      </h3>

      <div className="relative h-80">
        {/* Body silhouette */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg viewBox="0 0 100 200" className="h-full text-slate-600 fill-current">
            {/* Head */}
            <circle cx="50" cy="15" r="12" />
            {/* Neck */}
            <rect x="45" y="27" width="10" height="8" />
            {/* Torso */}
            <path d="M30 35 L70 35 L75 100 L25 100 Z" />
            {/* Left arm */}
            <path d="M30 35 L15 75 L20 80 L35 45" />
            {/* Right arm */}
            <path d="M70 35 L85 75 L80 80 L65 45" />
            {/* Left leg */}
            <path d="M35 100 L30 170 L40 175 L48 100" />
            {/* Right leg */}
            <path d="M65 100 L70 170 L60 175 L52 100" />
          </svg>
        </div>

        {/* Segment indicators */}
        {segments.map((segment, index) => (
          <motion.div
            key={segment.key}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="absolute"
            style={segment.position as React.CSSProperties}
          >
            <div
              className="bg-[#0A0A0F] border rounded-lg p-2 min-w-[80px]"
              style={{ borderColor: getAvaliacaoColor(segment.data.avaliacao) }}
            >
              <p className="text-xs text-slate-400 text-center mb-1">{segment.label}</p>
              <p className="text-white text-sm font-semibold text-center">
                {segment.data.massa_magra.toFixed(1)}kg
              </p>
              <p className="text-xs text-slate-500 text-center">
                {segment.data.percentual_gordura.toFixed(0)}% gordura
              </p>
              <div className="flex justify-center mt-1">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getAvaliacaoColor(segment.data.avaliacao)}20`,
                    color: getAvaliacaoColor(segment.data.avaliacao)
                  }}
                >
                  {getAvaliacaoLabel(segment.data.avaliacao)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary table */}
      <div className="mt-4 pt-4 border-t border-[#2E2E3E]">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-slate-500">Segmento</div>
          <div className="text-slate-500 text-center">Massa Magra</div>
          <div className="text-slate-500 text-center">Gordura</div>

          {segments.map(segment => (
            <div key={segment.key} className="contents">
              <div className="text-slate-300">{segment.label}</div>
              <div className="text-white text-center font-medium">
                {segment.data.massa_magra.toFixed(1)}kg
              </div>
              <div
                className="text-center font-medium"
                style={{ color: getAvaliacaoColor(segment.data.avaliacao) }}
              >
                {segment.data.percentual_gordura.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

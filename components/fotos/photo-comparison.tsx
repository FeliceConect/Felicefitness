"use client"

import { motion } from 'framer-motion'
import { ArrowRight, Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PhotoComparisonSlider } from './photo-comparison-slider'
import { type ProgressPhoto, type ComparisonMode, COMPARISON_MODE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoComparisonProps {
  before: ProgressPhoto
  after: ProgressPhoto
  mode?: ComparisonMode
  onModeChange?: (mode: ComparisonMode) => void
  showStats?: boolean
  className?: string
}

export function PhotoComparison({
  before,
  after,
  mode = 'side-by-side',
  onModeChange,
  showStats = true,
  className
}: PhotoComparisonProps) {
  // Calcular diferenças
  const daysBetween = Math.abs(
    Math.floor(
      (parseISO(after.data).getTime() - parseISO(before.data).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  )

  const weightChange = before.peso && after.peso
    ? after.peso - before.peso
    : null

  const fatChange = before.percentual_gordura && after.percentual_gordura
    ? after.percentual_gordura - before.percentual_gordura
    : null

  // Renderizar foto placeholder
  const renderPhotoPlaceholder = (photo: ProgressPhoto, label: string) => (
    <div className="flex flex-col">
      <div className="aspect-[3/4] bg-gradient-to-br from-dourado/10 to-vinho/10 rounded-xl flex items-center justify-center relative overflow-hidden">
        <span className="text-6xl opacity-30">
          {photo.tipo === 'frente' ? '🧍' :
           photo.tipo === 'lado_esquerdo' ? '👈' :
           photo.tipo === 'lado_direito' ? '👉' : '🔙'}
        </span>

        {/* Overlay com dados */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          {photo.peso && (
            <p className="text-white font-bold text-lg">{photo.peso.toFixed(1)}kg</p>
          )}
          {photo.percentual_gordura && (
            <p className="text-dourado text-sm">{photo.percentual_gordura.toFixed(1)}%</p>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-foreground-secondary text-xs uppercase tracking-wide">{label}</p>
        <p className="text-foreground text-sm">
          {format(parseISO(photo.data), "d MMM''yy", { locale: ptBR })}
        </p>
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Seletor de modo */}
      {onModeChange && (
        <div className="flex items-center justify-center gap-2">
          {(['side-by-side', 'slider', 'fade'] as ComparisonMode[]).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                mode === m
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              )}
            >
              {COMPARISON_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      {/* Visualização baseada no modo */}
      <div className="bg-white border border-border rounded-2xl p-4">
        {mode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-4">
            {renderPhotoPlaceholder(before, 'Antes')}
            {renderPhotoPlaceholder(after, 'Depois')}
          </div>
        )}

        {mode === 'slider' && (
          <PhotoComparisonSlider
            beforePhoto={before}
            afterPhoto={after}
          />
        )}

        {mode === 'fade' && (
          <div className="relative aspect-[3/4] max-w-[300px] mx-auto">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-dourado/10 to-vinho/10 rounded-xl flex items-center justify-center"
            >
              <span className="text-6xl opacity-30">
                {before.tipo === 'frente' ? '🧍' :
                 before.tipo === 'lado_esquerdo' ? '👈' :
                 before.tipo === 'lado_direito' ? '👉' : '🔙'}
              </span>
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <p className="text-foreground text-sm font-medium">ANTES</p>
                {before.peso && <p className="text-dourado text-sm">{before.peso.toFixed(1)}kg</p>}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-vinho/10 to-dourado/10 rounded-xl flex items-center justify-center"
            >
              <span className="text-6xl opacity-30">
                {after.tipo === 'frente' ? '🧍' :
                 after.tipo === 'lado_esquerdo' ? '👈' :
                 after.tipo === 'lado_direito' ? '👉' : '🔙'}
              </span>
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <p className="text-foreground text-sm font-medium">DEPOIS</p>
                {after.peso && <p className="text-dourado text-sm">{after.peso.toFixed(1)}kg</p>}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-4">
            <Calendar className="w-4 h-4" />
            <span>
              {daysBetween} {daysBetween === 1 ? 'dia' : 'dias'} de diferença
              {daysBetween >= 30 && ` (~${Math.round(daysBetween / 30)} meses)`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Peso */}
            {weightChange !== null && (
              <div className="bg-background rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  {weightChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  ) : weightChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-foreground-secondary" />
                  )}
                  <span className="text-xs text-foreground-muted">Peso</span>
                </div>
                <p className={cn(
                  'text-lg font-bold',
                  weightChange < 0 ? 'text-emerald-400' :
                  weightChange > 0 ? 'text-amber-400' : 'text-foreground'
                )}>
                  {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                </p>
                <p className="text-xs text-foreground-muted">
                  {before.peso?.toFixed(1)} <ArrowRight className="w-3 h-3 inline" /> {after.peso?.toFixed(1)}kg
                </p>
              </div>
            )}

            {/* Gordura */}
            {fatChange !== null && (
              <div className="bg-background rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  {fatChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  ) : fatChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-foreground-secondary" />
                  )}
                  <span className="text-xs text-foreground-muted">Gordura</span>
                </div>
                <p className={cn(
                  'text-lg font-bold',
                  fatChange < 0 ? 'text-emerald-400' :
                  fatChange > 0 ? 'text-red-400' : 'text-foreground'
                )}>
                  {fatChange >= 0 ? '+' : ''}{fatChange.toFixed(1)}%
                </p>
                <p className="text-xs text-foreground-muted">
                  {before.percentual_gordura?.toFixed(1)} <ArrowRight className="w-3 h-3 inline" /> {after.percentual_gordura?.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

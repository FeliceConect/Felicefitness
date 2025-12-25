"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Scale } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePhotos } from '@/hooks/use-photos'
import { PhotoTimeline } from '@/components/fotos'
import { type PhotoType, type ProgressPhoto, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

export default function TimelinePage() {
  const router = useRouter()
  const { photos } = usePhotos()

  const [selectedType, setSelectedType] = useState<PhotoType | 'all'>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)

  // Tipos de foto disponíveis
  const photoTypes: PhotoType[] = ['frente', 'lado_esquerdo', 'lado_direito', 'costas']

  // Filtrar fotos por tipo
  const filteredPhotos = useMemo(() => {
    const filtered = selectedType === 'all'
      ? photos
      : photos.filter(p => p.tipo === selectedType)

    return filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [photos, selectedType])

  // Calcular estatísticas de evolução
  const evolutionStats = useMemo(() => {
    if (filteredPhotos.length < 2) return null

    const first = filteredPhotos[0]
    const last = filteredPhotos[filteredPhotos.length - 1]

    const days = differenceInDays(parseISO(last.data), parseISO(first.data))

    const weightChange = (first.peso && last.peso)
      ? last.peso - first.peso
      : null

    const fatChange = (first.percentual_gordura && last.percentual_gordura)
      ? last.percentual_gordura - first.percentual_gordura
      : null

    return {
      days,
      totalPhotos: filteredPhotos.length,
      firstDate: first.data,
      lastDate: last.data,
      weightChange,
      fatChange,
      firstWeight: first.peso,
      lastWeight: last.peso
    }
  }, [filteredPhotos])

  const handlePhotoSelect = (photo: ProgressPhoto) => {
    setSelectedPhoto(photo)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Timeline de Evolução</h1>
        <p className="text-slate-400 text-sm">
          Acompanhe sua jornada ao longo do tempo
        </p>
      </div>

      {/* Filtros por tipo */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              selectedType === 'all'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
                : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
            )}
          >
            Todas
          </button>

          {photoTypes.map(type => {
            const count = photos.filter(p => p.tipo === type).length
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                disabled={count === 0}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                  selectedType === type
                    ? 'bg-violet-500 text-white'
                    : count === 0
                      ? 'bg-[#1E1E2E] text-slate-600 cursor-not-allowed'
                      : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
                )}
              >
                {PHOTO_TYPE_LABELS[type]}
                <span className="text-xs opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Estatísticas de evolução */}
      {evolutionStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-6"
        >
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
            <h3 className="text-white font-medium mb-4">Sua Evolução</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Período */}
              <div className="bg-[#0A0A0F] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-slate-400">Período</span>
                </div>
                <p className="text-white font-bold">{evolutionStats.days} dias</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(evolutionStats.firstDate), 'dd/MM', { locale: ptBR })} - {format(parseISO(evolutionStats.lastDate), 'dd/MM/yy', { locale: ptBR })}
                </p>
              </div>

              {/* Total de fotos */}
              <div className="bg-[#0A0A0F] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Registros</span>
                </div>
                <p className="text-white font-bold">{evolutionStats.totalPhotos} fotos</p>
                <p className="text-xs text-slate-500">
                  {selectedType === 'all' ? 'Todos os tipos' : PHOTO_TYPE_LABELS[selectedType]}
                </p>
              </div>
            </div>

            {/* Mudanças de peso e gordura */}
            {(evolutionStats.weightChange !== null || evolutionStats.fatChange !== null) && (
              <div className="grid grid-cols-2 gap-4">
                {evolutionStats.weightChange !== null && (
                  <div className={cn(
                    'rounded-xl p-3',
                    evolutionStats.weightChange < 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {evolutionStats.weightChange < 0 ? (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs text-slate-400">Peso</span>
                    </div>
                    <p className={cn(
                      'font-bold text-lg',
                      evolutionStats.weightChange < 0 ? 'text-emerald-400' : 'text-amber-400'
                    )}>
                      {evolutionStats.weightChange > 0 ? '+' : ''}{evolutionStats.weightChange.toFixed(1)}kg
                    </p>
                    <p className="text-xs text-slate-500">
                      {evolutionStats.firstWeight?.toFixed(1)} → {evolutionStats.lastWeight?.toFixed(1)}kg
                    </p>
                  </div>
                )}

                {evolutionStats.fatChange !== null && (
                  <div className={cn(
                    'rounded-xl p-3',
                    evolutionStats.fatChange < 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {evolutionStats.fatChange < 0 ? (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs text-slate-400">% Gordura</span>
                    </div>
                    <p className={cn(
                      'font-bold text-lg',
                      evolutionStats.fatChange < 0 ? 'text-emerald-400' : 'text-amber-400'
                    )}>
                      {evolutionStats.fatChange > 0 ? '+' : ''}{evolutionStats.fatChange.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline de fotos */}
      <div className="px-4">
        {filteredPhotos.length === 0 ? (
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-2">
              Nenhuma foto encontrada
            </p>
            <p className="text-slate-500 text-sm">
              {selectedType === 'all'
                ? 'Comece tirando sua primeira foto de progresso'
                : `Nenhuma foto do tipo "${PHOTO_TYPE_LABELS[selectedType]}"`
              }
            </p>
          </div>
        ) : filteredPhotos.length === 1 ? (
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-2">
              Apenas 1 foto encontrada
            </p>
            <p className="text-slate-500 text-sm">
              Tire mais fotos para ver sua evolução ao longo do tempo
            </p>
          </div>
        ) : (
          <PhotoTimeline
            photos={filteredPhotos}
            onSelectPhoto={handlePhotoSelect}
          />
        )}
      </div>

      {/* Card da foto selecionada */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-6"
        >
          <div className="bg-[#14141F] border border-violet-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Foto Selecionada</h4>
              <button
                onClick={() => router.push(`/fotos/${selectedPhoto.id}`)}
                className="text-violet-400 text-sm hover:text-violet-300 transition-colors"
              >
                Ver detalhes
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-20 aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-violet-900/30 to-cyan-900/30 flex items-center justify-center">
                <span className="text-2xl opacity-30">
                  {selectedPhoto.tipo === 'frente' ? '🧍' :
                   selectedPhoto.tipo === 'lado_esquerdo' ? '👈' :
                   selectedPhoto.tipo === 'lado_direito' ? '👉' : '🔙'}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-white font-medium">
                  {PHOTO_TYPE_LABELS[selectedPhoto.tipo]}
                </p>
                <p className="text-slate-400 text-sm">
                  {format(parseISO(selectedPhoto.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
                </p>

                {selectedPhoto.peso && (
                  <p className="text-cyan-400 text-sm mt-2">
                    Peso: {selectedPhoto.peso.toFixed(1)}kg
                  </p>
                )}

                {selectedPhoto.percentual_gordura && (
                  <p className="text-amber-400 text-sm">
                    Gordura: {selectedPhoto.percentual_gordura.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {selectedPhoto.notas && (
              <div className="mt-3 pt-3 border-t border-[#2E2E3E]">
                <p className="text-slate-500 text-xs mb-1">Notas</p>
                <p className="text-slate-300 text-sm">{selectedPhoto.notas}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Dicas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-6"
      >
        <div className="bg-gradient-to-r from-violet-900/20 to-cyan-900/20 border border-violet-500/20 rounded-2xl p-4">
          <p className="text-white font-medium mb-2">Dica para evolução</p>
          <p className="text-slate-400 text-sm">
            Para melhores comparações, tire fotos sempre no mesmo local,
            com a mesma iluminação e no mesmo horário (ex: manhã em jejum).
          </p>
        </div>
      </motion.div>
    </div>
  )
}

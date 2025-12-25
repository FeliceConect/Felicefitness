"use client"

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type ProgressPhoto, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoTimelineProps {
  photos: ProgressPhoto[]
  onSelectPhoto?: (photo: ProgressPhoto) => void
  className?: string
}

export function PhotoTimeline({
  photos,
  onSelectPhoto,
  className
}: PhotoTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState(photos.length - 1)
  const [isPlaying, setIsPlaying] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const selectedPhoto = photos[selectedIndex]

  // Navegar para anterior
  const goToPrev = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1
      setSelectedIndex(newIndex)
      onSelectPhoto?.(photos[newIndex])
    }
  }

  // Navegar para próximo
  const goToNext = () => {
    if (selectedIndex < photos.length - 1) {
      const newIndex = selectedIndex + 1
      setSelectedIndex(newIndex)
      onSelectPhoto?.(photos[newIndex])
    }
  }

  // Selecionar foto específica
  const selectPhoto = (index: number) => {
    setSelectedIndex(index)
    onSelectPhoto?.(photos[index])
    setIsPlaying(false)
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
  }

  // Slideshow
  const toggleSlideshow = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    } else {
      setIsPlaying(true)
      playIntervalRef.current = setInterval(() => {
        setSelectedIndex(prev => {
          const next = prev + 1
          if (next >= photos.length) {
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
            }
            return prev
          }
          onSelectPhoto?.(photos[next])
          return next
        })
      }, 2000)
    }
  }

  if (photos.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-slate-400">Nenhuma foto para exibir</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Foto principal */}
      <motion.div
        key={selectedPhoto.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl overflow-hidden"
      >
        <div className="aspect-[3/4] max-w-[350px] mx-auto relative">
          {/* Foto placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-cyan-900/30 flex items-center justify-center">
            <span className="text-[80px] opacity-30">
              {selectedPhoto.tipo === 'frente' ? '🧍' :
               selectedPhoto.tipo === 'lado_esquerdo' ? '👈' :
               selectedPhoto.tipo === 'lado_direito' ? '👉' : '🔙'}
            </span>
          </div>

          {/* Overlay com dados */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">
                  {PHOTO_TYPE_LABELS[selectedPhoto.tipo]}
                </p>
                <p className="text-slate-400 text-sm">
                  {format(parseISO(selectedPhoto.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
              {selectedPhoto.peso && (
                <div className="text-right">
                  <p className="text-cyan-400 font-bold text-lg">
                    {selectedPhoto.peso.toFixed(1)}kg
                  </p>
                  {selectedPhoto.percentual_gordura && (
                    <p className="text-amber-400 text-sm">
                      {selectedPhoto.percentual_gordura.toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botões de navegação */}
          {selectedIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {selectedIndex < photos.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Controles de slideshow */}
      <div className="flex items-center justify-center">
        <button
          onClick={toggleSlideshow}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
            isPlaying
              ? 'bg-violet-500 text-white'
              : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
          )}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="text-sm">Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="text-sm">Reproduzir</span>
            </>
          )}
        </button>
      </div>

      {/* Carrossel de miniaturas */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectPhoto(index)}
              className={cn(
                'flex-shrink-0 w-16 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors',
                index === selectedIndex
                  ? 'border-violet-500'
                  : 'border-transparent hover:border-violet-500/50'
              )}
            >
              <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-cyan-900/30 flex items-center justify-center">
                <span className="text-xl opacity-30">
                  {photo.tipo === 'frente' ? '🧍' :
                   photo.tipo === 'lado_esquerdo' ? '👈' :
                   photo.tipo === 'lado_direito' ? '👉' : '🔙'}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Linha do tempo */}
      <div className="relative px-4">
        <div className="h-1 bg-[#2E2E3E] rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((selectedIndex + 1) / photos.length) * 100}%`
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Marcadores de data */}
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>
            {format(parseISO(photos[0].data), 'MMM/yy', { locale: ptBR })}
          </span>
          <span>
            {format(parseISO(photos[photos.length - 1].data), 'MMM/yy', { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Indicador de progresso */}
      <div className="text-center text-sm text-slate-400">
        {selectedIndex + 1} de {photos.length} fotos
      </div>
    </div>
  )
}

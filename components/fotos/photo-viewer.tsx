"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Trash2, Share2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type ProgressPhoto, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoViewerProps {
  photo?: ProgressPhoto
  photos?: ProgressPhoto[] // Para navegação
  initialIndex?: number // Índice inicial quando usando photos
  onClose?: () => void
  onFavoriteToggle?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
  showOverlay?: boolean
  className?: string
}

export function PhotoViewer({
  photo,
  photos,
  initialIndex = 0,
  onClose,
  onFavoriteToggle,
  onDelete,
  onShare,
  showOverlay = true,
  className
}: PhotoViewerProps) {
  // Determinar foto inicial
  const getInitialPhoto = (): ProgressPhoto | null => {
    if (photo) return photo
    if (photos && photos.length > 0) {
      return photos[Math.min(initialIndex, photos.length - 1)]
    }
    return null
  }

  const [currentPhoto, setCurrentPhoto] = useState<ProgressPhoto | null>(getInitialPhoto)
  const [zoom, setZoom] = useState(1)
  const [showControls, setShowControls] = useState(true)

  // Se não há foto, não renderiza
  if (!currentPhoto) {
    return null
  }

  // Encontrar índice atual para navegação
  const currentIndex = photos?.findIndex(p => p.id === currentPhoto.id) ?? -1
  const hasPrev = currentIndex > 0
  const hasNext = photos && currentIndex < photos.length - 1

  const goToPrev = () => {
    if (photos && hasPrev) {
      setCurrentPhoto(photos[currentIndex - 1])
      setZoom(1)
    }
  }

  const goToNext = () => {
    if (photos && hasNext) {
      setCurrentPhoto(photos[currentIndex + 1])
      setZoom(1)
    }
  }

  const toggleZoom = () => {
    setZoom(prev => (prev === 1 ? 2 : 1))
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black flex flex-col',
        className
      )}
      onClick={() => setShowControls(prev => !prev)}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              )}

              <div className="flex items-center gap-2">
                {onFavoriteToggle && (
                  <button
                    onClick={() => onFavoriteToggle(currentPhoto.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Heart
                      className={cn(
                        'w-6 h-6',
                        currentPhoto.favorita
                          ? 'fill-red-500 text-red-500'
                          : 'text-white'
                      )}
                    />
                  </button>
                )}

                {onShare && (
                  <button
                    onClick={() => onShare(currentPhoto.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Share2 className="w-6 h-6 text-white" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(currentPhoto.id)}
                    className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Imagem */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          animate={{ scale: zoom }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Placeholder visual */}
          <div className="w-full max-w-md aspect-[3/4] bg-gradient-to-br from-dourado/10 to-vinho/10 rounded-xl flex items-center justify-center">
            <span className="text-[100px] opacity-30">
              {currentPhoto.tipo === 'frente' ? '🧍' :
               currentPhoto.tipo === 'lado_esquerdo' ? '👈' :
               currentPhoto.tipo === 'lado_direito' ? '👉' : '🔙'}
            </span>
          </div>
        </motion.div>

        {/* Botões de navegação */}
        <AnimatePresence>
          {showControls && photos && photos.length > 1 && (
            <>
              {hasPrev && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrev()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
              )}

              {hasNext && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm rounded-full"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Botão de zoom */}
        <AnimatePresence>
          {showControls && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => {
                e.stopPropagation()
                toggleZoom()
              }}
              className="absolute right-4 bottom-4 p-3 bg-white/10 backdrop-blur-sm rounded-full"
            >
              {zoom === 1 ? (
                <ZoomIn className="w-5 h-5 text-white" />
              ) : (
                <ZoomOut className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Footer com informações */}
      <AnimatePresence>
        {showControls && showOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-gradient-to-t from-black/80 to-transparent"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">
                  {PHOTO_TYPE_LABELS[currentPhoto.tipo]}
                </span>
                <span className="text-white/60 text-sm">
                  {format(parseISO(currentPhoto.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>

              {(currentPhoto.peso || currentPhoto.percentual_gordura) && (
                <div className="flex items-center gap-4">
                  {currentPhoto.peso && (
                    <span className="text-dourado text-sm">
                      {currentPhoto.peso.toFixed(1)}kg
                    </span>
                  )}
                  {currentPhoto.percentual_gordura && (
                    <span className="text-dourado/80 text-sm">
                      {currentPhoto.percentual_gordura.toFixed(1)}% gordura
                    </span>
                  )}
                </div>
              )}

              {currentPhoto.notas && (
                <p className="text-white/60 text-sm mt-2">
                  {currentPhoto.notas}
                </p>
              )}

              {/* Indicador de posição */}
              {photos && photos.length > 1 && (
                <div className="flex justify-center gap-1 mt-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        p.id === currentPhoto.id
                          ? 'bg-white'
                          : 'bg-white/30'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Trash2,
  Share2,
  Calendar,
  Scale,
  Percent,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePhotos } from '@/hooks/use-photos'
import { PhotoViewer } from '@/components/fotos'
import { PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

export default function PhotoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const photoId = params.id as string

  const { photos, toggleFavorite, deletePhoto } = usePhotos()
  const [showViewer, setShowViewer] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Encontrar foto atual e navegação
  const currentIndex = photos.findIndex(p => p.id === photoId)
  const photo = photos[currentIndex]
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const success = await deletePhoto(photoId)
      if (success) {
        router.push('/fotos')
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleShare = async () => {
    if (!photo) return

    // TODO: Gerar share card com createShareCard
    // Por enquanto, usar Web Share API básica
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto de Progresso - ${PHOTO_TYPE_LABELS[photo.tipo]}`,
          text: `${format(parseISO(photo.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}${photo.peso ? ` - ${photo.peso}kg` : ''}`,
        })
      } catch {
        // Usuário cancelou ou erro
      }
    }
  }

  const navigateToPhoto = (id: string) => {
    router.push(`/fotos/${id}`)
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-secondary mb-4">Foto não encontrada</p>
          <button
            onClick={() => router.push('/fotos')}
            className="px-4 py-2 bg-dourado text-white rounded-xl"
          >
            Voltar para galeria
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(photo.id)}
            className="p-2 bg-background-elevated rounded-xl"
          >
            <Star
              className={cn(
                'w-5 h-5',
                photo.favorita ? 'fill-yellow-400 text-yellow-400' : 'text-foreground-secondary'
              )}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="p-2 bg-background-elevated rounded-xl"
          >
            <Share2 className="w-5 h-5 text-foreground-secondary" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 bg-background-elevated rounded-xl"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Foto principal */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div
            onClick={() => setShowViewer(true)}
            className="aspect-[3/4] max-w-[350px] mx-auto rounded-2xl overflow-hidden bg-white cursor-pointer"
          >
            {/* Placeholder visual */}
            <div className="absolute inset-0 bg-gradient-to-br from-dourado/10 to-vinho/10 flex items-center justify-center">
              <span className="text-[100px] opacity-30">
                {photo.tipo === 'frente' ? '🧍' :
                 photo.tipo === 'lado_esquerdo' ? '👈' :
                 photo.tipo === 'lado_direito' ? '👉' : '🔙'}
              </span>
            </div>

            {/* Badge tipo */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 rounded-full">
              <span className="text-white text-sm font-medium">
                {PHOTO_TYPE_LABELS[photo.tipo]}
              </span>
            </div>

            {/* Favorita */}
            {photo.favorita && (
              <div className="absolute top-4 right-4">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </div>
            )}
          </div>

          {/* Navegação entre fotos */}
          {prevPhoto && (
            <button
              onClick={() => navigateToPhoto(prevPhoto.id)}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-r-xl hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {nextPhoto && (
            <button
              onClick={() => navigateToPhoto(nextPhoto.id)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-l-xl hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Dados da foto */}
      <div className="px-4 space-y-4">
        {/* Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-dourado" />
            </div>
            <div>
              <p className="text-foreground-secondary text-xs">Data</p>
              <p className="text-foreground font-medium">
                {format(parseISO(photo.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Peso e % Gordura */}
        {(photo.peso || photo.percentual_gordura) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {photo.peso && (
              <div className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-dourado" />
                  </div>
                  <div>
                    <p className="text-foreground-secondary text-xs">Peso</p>
                    <p className="text-foreground font-bold text-lg">
                      {photo.peso.toFixed(1)}kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {photo.percentual_gordura && (
              <div className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-foreground-secondary text-xs">Gordura</p>
                    <p className="text-foreground font-bold text-lg">
                      {photo.percentual_gordura.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Notas */}
        {photo.notas && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-border rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-foreground-secondary text-xs mb-1">Notas</p>
                <p className="text-foreground text-sm">{photo.notas}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navegação para fotos do mesmo tipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-foreground-muted py-4"
        >
          Foto {currentIndex + 1} de {photos.length}
        </motion.div>
      </div>

      {/* Visualizador em tela cheia */}
      {showViewer && (
        <PhotoViewer
          photos={photos}
          initialIndex={currentIndex}
          onClose={() => setShowViewer(false)}
          onFavoriteToggle={toggleFavorite}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Excluir foto?</h3>
                <p className="text-foreground-secondary text-sm">
                  Esta ação não pode ser desfeita. A foto será removida permanentemente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-3 bg-background-elevated text-foreground rounded-xl font-medium border border-border"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    'py-3 rounded-xl font-medium flex items-center justify-center gap-2',
                    isDeleting
                      ? 'bg-background-elevated text-foreground-secondary cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  )}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

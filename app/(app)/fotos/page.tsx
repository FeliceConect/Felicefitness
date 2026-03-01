"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera, Heart, Scale, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { PhotoGrid } from '@/components/fotos'
import { usePhotos } from '@/hooks/use-photos'
import { type PhotoType, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

export default function FotosPage() {
  const {
    photos,
    photosByMonth,
    favoritePhotos,
    stats,
    typeFilter,
    setTypeFilter,
    toggleFavorite,
    isLoading
  } = usePhotos()

  const [showFavorites, setShowFavorites] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground-secondary">Carregando...</div>
      </div>
    )
  }

  const displayPhotos = showFavorites ? favoritePhotos : photos

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Fotos de Progresso</h1>
          <Link href="/fotos/nova">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gradient-to-r from-dourado to-dourado rounded-xl"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
        </div>
        <p className="text-foreground-secondary text-sm">
          {stats.total} fotos registradas
        </p>
      </div>

      {/* Estatísticas rápidas */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2"
        >
          {(['frente', 'lado_esquerdo', 'lado_direito', 'costas'] as PhotoType[]).map(type => (
            <div
              key={type}
              className="bg-white border border-border rounded-xl p-2 text-center"
            >
              <p className="text-lg font-bold text-foreground">{stats.byType[type]}</p>
              <p className="text-[10px] text-foreground-muted truncate">
                {PHOTO_TYPE_LABELS[type]}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setShowFavorites(false)
              setTypeFilter(null)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              !typeFilter && !showFavorites
                ? 'bg-dourado text-white'
                : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
            )}
          >
            Todas
          </button>

          <button
            onClick={() => {
              setShowFavorites(true)
              setTypeFilter(null)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1',
              showFavorites
                ? 'bg-red-500 text-white'
                : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
            )}
          >
            <Heart className="w-3 h-3" />
            Favoritas
          </button>

          {(['frente', 'lado_esquerdo', 'lado_direito', 'costas'] as PhotoType[]).map(type => (
            <button
              key={type}
              onClick={() => {
                setShowFavorites(false)
                setTypeFilter(typeFilter === type ? null : type)
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                typeFilter === type && !showFavorites
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              )}
            >
              {PHOTO_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Galeria */}
      <div className="px-4 mb-6">
        {displayPhotos.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-8 text-center">
            <Camera className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary mb-2">
              {showFavorites
                ? 'Nenhuma foto favorita'
                : 'Nenhuma foto registrada'}
            </p>
            <Link href="/fotos/nova">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gradient-to-r from-dourado to-dourado text-white rounded-xl text-sm font-medium"
              >
                Tirar primeira foto
              </motion.button>
            </Link>
          </div>
        ) : showFavorites ? (
          <PhotoGrid
            photos={displayPhotos}
            columns={3}
            onFavoriteToggle={toggleFavorite}
          />
        ) : (
          <PhotoGrid
            photosByMonth={photosByMonth}
            columns={3}
            onFavoriteToggle={toggleFavorite}
            showMonthHeaders
          />
        )}
      </div>

      {/* Ações rápidas */}
      {photos.length > 1 && (
        <div className="px-4 space-y-3">
          {/* Comparar */}
          <Link href="/fotos/comparar">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-border rounded-xl p-4 flex items-center justify-between hover:border-dourado/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-dourado" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Comparar Fotos</p>
                  <p className="text-sm text-foreground-secondary">Veja o antes e depois</p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Timeline */}
          <Link href="/fotos/timeline">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-border rounded-xl p-4 flex items-center justify-between hover:border-dourado/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-dourado" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Timeline de Evolução</p>
                  <p className="text-sm text-foreground-secondary">Acompanhe sua jornada</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      )}
    </div>
  )
}

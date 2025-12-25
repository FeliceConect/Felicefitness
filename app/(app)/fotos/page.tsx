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
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    )
  }

  const displayPhotos = showFavorites ? favoritePhotos : photos

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Fotos de Progresso</h1>
          <Link href="/fotos/nova">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-xl"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
        </div>
        <p className="text-slate-400 text-sm">
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
              className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-2 text-center"
            >
              <p className="text-lg font-bold text-white">{stats.byType[type]}</p>
              <p className="text-[10px] text-slate-500 truncate">
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
                ? 'bg-violet-500 text-white'
                : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
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
                : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
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
                  ? 'bg-violet-500 text-white'
                  : 'bg-[#1E1E2E] text-slate-400 hover:text-white'
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
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8 text-center">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">
              {showFavorites
                ? 'Nenhuma foto favorita'
                : 'Nenhuma foto registrada'}
            </p>
            <Link href="/fotos/nova">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl text-sm font-medium"
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
              className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Comparar Fotos</p>
                  <p className="text-sm text-slate-400">Veja o antes e depois</p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Timeline */}
          <Link href="/fotos/timeline">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Timeline de Evolução</p>
                  <p className="text-sm text-slate-400">Acompanhe sua jornada</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      )}
    </div>
  )
}

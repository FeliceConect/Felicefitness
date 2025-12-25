"use client"

import { motion } from 'framer-motion'
import { PhotoCard } from './photo-card'
import { type ProgressPhoto, type PhotosByMonth } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoGridProps {
  photos?: ProgressPhoto[]
  photosByMonth?: PhotosByMonth[]
  onFavoriteToggle?: (id: string) => void
  columns?: 2 | 3 | 4
  showMonthHeaders?: boolean
  className?: string
}

export function PhotoGrid({
  photos,
  photosByMonth,
  onFavoriteToggle,
  columns = 3,
  showMonthHeaders = true,
  className
}: PhotoGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  // Se recebeu fotos agrupadas por mês
  if (photosByMonth && showMonthHeaders) {
    return (
      <div className={cn('space-y-6', className)}>
        {photosByMonth.map((group, groupIndex) => (
          <motion.div
            key={group.month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          >
            {/* Cabeçalho do mês */}
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 capitalize">
              {group.label}
            </h3>

            {/* Grid de fotos */}
            <div className={cn('grid gap-2', gridClasses[columns])}>
              {group.photos.map((photo, photoIndex) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    delay: groupIndex * 0.1 + photoIndex * 0.03
                  }}
                >
                  <PhotoCard
                    photo={photo}
                    onFavoriteToggle={onFavoriteToggle}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Se recebeu lista simples de fotos
  if (photos) {
    return (
      <div className={cn('grid gap-2', gridClasses[columns], className)}>
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <PhotoCard
              photo={photo}
              onFavoriteToggle={onFavoriteToggle}
              size="sm"
            />
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

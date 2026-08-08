"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Calendar, ImageOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { type ProgressPhoto, PHOTO_TYPE_LABELS } from '@/lib/photos/types'
import { myProgressPhotoSrc } from '@/lib/photos/proxy-url'
import { cn } from '@/lib/utils'

interface PhotoCardProps {
  photo: ProgressPhoto
  onFavoriteToggle?: (id: string) => void
  showOverlay?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'aspect-[3/4]',
  md: 'aspect-[3/4]',
  lg: 'aspect-[3/4]'
}

export function PhotoCard({
  photo,
  onFavoriteToggle,
  showOverlay = true,
  size = 'md',
  className
}: PhotoCardProps) {
  const [failed, setFailed] = useState(false)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavoriteToggle?.(photo.id)
  }

  return (
    <Link href={`/fotos/${photo.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden rounded-xl bg-background-elevated cursor-pointer group',
          sizeClasses[size],
          className
        )}
      >
        {/* Imagem */}
        <div className="absolute inset-0 bg-gradient-to-br from-dourado/10 to-vinho/10">
          {failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-foreground-muted">
              <ImageOff className="w-5 h-5" />
              <span className="text-[10px]">Não carregou</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={myProgressPhotoSrc(photo.id)}
              alt={`Foto ${PHOTO_TYPE_LABELS[photo.tipo]} de ${format(parseISO(photo.data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* Favorito */}
        {onFavoriteToggle && (
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Heart
              className={cn(
                'w-4 h-4',
                photo.favorita ? 'fill-red-500 text-red-500' : 'text-white'
              )}
            />
          </motion.button>
        )}

        {/* Overlay com informações */}
        {showOverlay && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <p className="text-white text-xs font-medium">
              {PHOTO_TYPE_LABELS[photo.tipo]}
            </p>
            <div className="flex items-center gap-1 text-foreground-secondary text-[10px]">
              <Calendar className="w-3 h-3" />
              <span>
                {format(parseISO(photo.data), 'd MMM yy', { locale: ptBR })}
              </span>
            </div>
            {photo.peso && (
              <p className="text-dourado text-[10px] font-medium mt-0.5">
                {photo.peso.toFixed(1)}kg
              </p>
            )}
          </div>
        )}

        {/* Badge de favorita */}
        {photo.favorita && !onFavoriteToggle && (
          <div className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full">
            <Heart className="w-3 h-3 fill-white text-white" />
          </div>
        )}
      </motion.div>
    </Link>
  )
}

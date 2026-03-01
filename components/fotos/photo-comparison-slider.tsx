"use client"

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { type ProgressPhoto } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PhotoComparisonSliderProps {
  beforePhoto: ProgressPhoto
  afterPhoto: ProgressPhoto
  initialPosition?: number
  className?: string
}

export function PhotoComparisonSlider({
  beforePhoto,
  afterPhoto,
  initialPosition = 50,
  className
}: PhotoComparisonSliderProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(percentage)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleMove(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    handleMove(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Placeholder visual para fotos
  const renderPhotoPlaceholder = (photo: ProgressPhoto, isAfter: boolean) => (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        isAfter
          ? 'bg-gradient-to-br from-vinho/10 to-dourado/10'
          : 'bg-gradient-to-br from-dourado/10 to-vinho/10'
      )}
    >
      <span className="text-6xl opacity-30">
        {photo.tipo === 'frente' ? '🧍' :
         photo.tipo === 'lado_esquerdo' ? '👈' :
         photo.tipo === 'lado_direito' ? '👉' : '🔙'}
      </span>

      {/* Label */}
      <div className={cn(
        'absolute top-4 px-3 py-1 bg-black/60 rounded-full',
        isAfter ? 'right-4' : 'left-4'
      )}>
        <span className="text-white text-xs font-medium">
          {isAfter ? 'DEPOIS' : 'ANTES'}
        </span>
      </div>

      {/* Dados */}
      <div className={cn(
        'absolute bottom-4 bg-black/60 rounded-lg px-3 py-2',
        isAfter ? 'right-4' : 'left-4'
      )}>
        {photo.peso && (
          <p className="text-white font-bold">{photo.peso.toFixed(1)}kg</p>
        )}
        {photo.percentual_gordura && (
          <p className="text-dourado text-sm">{photo.percentual_gordura.toFixed(1)}%</p>
        )}
      </div>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-[3/4] max-w-[350px] mx-auto rounded-xl overflow-hidden cursor-ew-resize select-none',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Foto depois (fundo) */}
      {renderPhotoPlaceholder(afterPhoto, true)}

      {/* Foto antes (sobreposta com clip) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {renderPhotoPlaceholder(beforePhoto, false)}
      </div>

      {/* Linha divisória */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <motion.div
          animate={{ scale: isDragging ? 1.2 : 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center"
        >
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-4 bg-foreground-muted rounded-full" />
            <div className="w-0.5 h-4 bg-foreground-muted rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Instruções */}
      {!isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1.5 rounded-full"
        >
          <span className="text-white text-xs">Arraste para comparar</span>
        </motion.div>
      )}
    </div>
  )
}

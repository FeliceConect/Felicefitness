'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
}

interface ConfettiProps {
  isActive: boolean
  duration?: number
  pieceCount?: number
  colors?: string[]
  onComplete?: () => void
}

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
  onComplete
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360
      }))
      setPieces(newPieces)

      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setPieces([])
    }
  }, [isActive, pieceCount, colors, duration, onComplete])

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${piece.x}%`,
                backgroundColor: piece.color,
                rotate: piece.rotation
              }}
              initial={{ y: -20, opacity: 1, scale: 1 }}
              animate={{
                y: '100vh',
                opacity: [1, 1, 0],
                rotate: piece.rotation + 720,
                x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                delay: piece.delay,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// Mini confetti para celebrações menores
export function MiniConfetti({
  isActive,
  onComplete
}: {
  isActive: boolean
  onComplete?: () => void
}) {
  return (
    <Confetti
      isActive={isActive}
      duration={2000}
      pieceCount={20}
      onComplete={onComplete}
    />
  )
}

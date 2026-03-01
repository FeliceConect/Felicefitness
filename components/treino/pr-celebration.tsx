"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'

interface PRCelebrationProps {
  isOpen: boolean
  exerciseName: string
  weight: number
  reps: number
  onClose: () => void
}

export function PRCelebration({
  isOpen,
  exerciseName,
  weight,
  reps,
  onClose
}: PRCelebrationProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (isOpen) {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
      // Vibrate on PR
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200])
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
        >
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            colors={['#c29863', '#663739', '#10B981', '#F59E0B', '#EF4444']}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center px-8"
          >
            {/* Trophy icon with glow */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: 2
              }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 blur-xl bg-amber-500/50 rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Novo Recorde Pessoal! 🎉
            </motion.h2>

            {/* Exercise name */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-foreground-secondary mb-6"
            >
              {exerciseName}
            </motion.p>

            {/* PR details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-4xl font-bold text-amber-400">{weight}</p>
                  <p className="text-sm text-foreground-secondary">kg</p>
                </div>
                <span className="text-2xl text-foreground-muted">×</span>
                <div>
                  <p className="text-4xl font-bold text-amber-400">{reps}</p>
                  <p className="text-sm text-foreground-secondary">reps</p>
                </div>
              </div>
            </motion.div>

            {/* Close button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="gradient"
                size="lg"
                onClick={onClose}
              >
                Continuar Treino 💪
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

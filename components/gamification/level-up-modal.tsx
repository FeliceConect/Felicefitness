"use client"

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Level } from '@/types/gamification'
import { getLevelEmoji, getLevelGradient } from '@/lib/gamification'

interface LevelUpModalProps {
  isOpen: boolean
  level: Level | null
  onClose: () => void
}

export function LevelUpModal({ isOpen, level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen && level) {
      // Disparar confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: [level.color, '#8B5CF6', '#FFD700']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: [level.color, '#8B5CF6', '#FFD700']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [isOpen, level])

  if (!level) return null

  const emoji = getLevelEmoji(level)
  const gradient = getLevelGradient(level)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-card to-background border border-primary/30 shadow-2xl"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Efeito de brilho */}
            <div
              className="absolute inset-0 rounded-2xl opacity-20"
              style={{ background: gradient }}
            />

            <div className="relative flex flex-col items-center text-center space-y-4">
              {/* Ícone animado */}
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: gradient, boxShadow: `0 0 40px ${level.color}60` }}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {emoji}
              </motion.div>

              {/* Título */}
              <motion.h2
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Level Up!
              </motion.h2>

              {/* Nível */}
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground">Você alcançou o</p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: level.color }}
                >
                  Nível {level.level}
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{ color: level.color }}
                >
                  {level.name}
                </p>
              </motion.div>

              {/* Mensagem */}
              <motion.p
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Continue evoluindo para desbloquear novos poderes!
              </motion.p>

              {/* Botão */}
              <motion.button
                className="mt-4 px-6 py-3 rounded-full font-semibold text-white"
                style={{ background: gradient }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Continuar 💪
              </motion.button>
            </div>

            {/* Partículas de fundo */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: level.color
                  }}
                  animate={{
                    y: [-20, -100],
                    opacity: [1, 0],
                    scale: [1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

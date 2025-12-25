"use client"

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Achievement } from '@/types/gamification'
import { TIER_COLORS, TIER_GRADIENTS } from '@/lib/gamification'

interface AchievementModalProps {
  isOpen: boolean
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementModal({ isOpen, achievement, onClose }: AchievementModalProps) {
  useEffect(() => {
    if (isOpen && achievement) {
      // Confetti com cores do tier
      const tierColor = TIER_COLORS[achievement.tier]
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [tierColor, '#8B5CF6', '#FFD700', '#10B981']
      })
    }
  }, [isOpen, achievement])

  if (!achievement) return null

  const tierColor = TIER_COLORS[achievement.tier]
  const tierGradient = TIER_GRADIENTS[achievement.tier]
  const tierName = achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)

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
            className="relative z-10 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-card to-background border shadow-2xl"
            style={{ borderColor: `${tierColor}40` }}
            initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateX: -45 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Badge de Tier */}
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-black"
              style={{ background: tierGradient }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {tierName}
            </motion.div>

            <div className="relative flex flex-col items-center text-center space-y-4 mt-4">
              {/* Ícone */}
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: tierGradient,
                    filter: 'blur(20px)',
                    opacity: 0.5
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4"
                  style={{
                    background: `linear-gradient(135deg, ${tierColor}20 0%, transparent 100%)`,
                    borderColor: tierColor
                  }}
                >
                  {achievement.icon}
                </div>
              </motion.div>

              {/* Título */}
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground text-sm">Conquista Desbloqueada!</p>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: tierColor }}
                >
                  {achievement.name}
                </h2>
              </motion.div>

              {/* Descrição */}
              <motion.p
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {achievement.description}
              </motion.p>

              {/* XP Reward */}
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <span className="text-xl">⭐</span>
                <span className="text-amber-500 font-bold text-lg">
                  +{achievement.xpReward} XP
                </span>
              </motion.div>

              {/* Botão */}
              <motion.button
                className="mt-4 px-6 py-3 rounded-full font-semibold text-black"
                style={{ background: tierGradient }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Incrível! 🎉
              </motion.button>
            </div>

            {/* Sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 180]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

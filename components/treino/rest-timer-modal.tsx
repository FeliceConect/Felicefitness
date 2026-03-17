"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, SkipForward } from 'lucide-react'

interface RestTimerModalProps {
  isOpen: boolean
  timeRemaining: number
  totalTime: number
  progress: number
  onSkip: () => void
  onAddTime: (seconds: number) => void
  exerciseName?: string
  nextExercise?: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RestTimerModal({
  isOpen,
  timeRemaining,
  totalTime,
  progress,
  onSkip,
  onAddTime,
  exerciseName,
  nextExercise
}: RestTimerModalProps) {
  const radius = 100
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center px-6"
          >
            {/* Timer label */}
            <p className="text-white/60 text-lg mb-2">Descanse</p>

            {/* Exercise name */}
            {exerciseName && (
              <p className="text-dourado font-heading font-bold text-xl mb-6">{exerciseName}</p>
            )}
            {!exerciseName && <div className="mb-6" />}

            {/* Circular timer */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="rgba(194, 152, 99, 0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="url(#restGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
                <defs>
                  <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c29863" />
                    <stop offset="100%" stopColor="#663739" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={timeRemaining}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-white font-heading"
                >
                  {formatTime(timeRemaining)}
                </motion.span>
                <span className="text-white/40 text-sm mt-2">
                  de {formatTime(totalTime)}
                </span>
              </div>
            </div>

            {/* Add time buttons */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => onAddTime(15)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                15s
              </button>
              <button
                onClick={() => onAddTime(30)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                30s
              </button>
            </div>

            {/* Skip button */}
            <button
              onClick={onSkip}
              className="flex items-center gap-2 mx-auto text-white/50 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Pular descanso
            </button>

            {/* Next exercise hint */}
            {nextExercise && (
              <p className="mt-6 text-white/30 text-sm">
                Próximo: {nextExercise}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

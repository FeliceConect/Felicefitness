"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestTimerModalProps {
  isOpen: boolean
  timeRemaining: number
  totalTime: number
  progress: number
  onSkip: () => void
  onAddTime: (seconds: number) => void
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
  onAddTime
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
          className="fixed inset-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-sm flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center"
          >
            {/* Timer label */}
            <p className="text-slate-400 text-lg mb-8">Descanse</p>

            {/* Circular timer */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="rgba(139, 92, 246, 0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="url(#gradient)"
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
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={timeRemaining}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-white"
                >
                  {formatTime(timeRemaining)}
                </motion.span>
                <span className="text-slate-500 text-sm mt-2">
                  de {formatTime(totalTime)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onAddTime(15)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                15s
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onAddTime(30)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                30s
              </Button>
            </div>

            {/* Skip button */}
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-slate-400 hover:text-white gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Pular descanso
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

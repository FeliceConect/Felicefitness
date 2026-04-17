'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { YouTubeEmbed } from '@/components/shared/youtube-embed'

interface ExerciseVideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
  exerciseName: string
  instructions?: string
}

export function ExerciseVideoModal({ isOpen, onClose, videoUrl, exerciseName, instructions }: ExerciseVideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center px-4 overflow-y-auto"
          style={{
            paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-full overflow-hidden flex flex-col shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="text-foreground font-semibold truncate pr-4">{exerciseName}</h3>
              <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {videoUrl && (
                <div className="p-4">
                  <YouTubeEmbed url={videoUrl} title={exerciseName} />
                </div>
              )}
              {instructions && (
                <div className={videoUrl ? 'px-4 pb-4' : 'p-4'}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Instruções</h4>
                  <div className="space-y-2">
                    {instructions.split('\n').filter(line => line.trim()).map((line, i) => (
                      <div key={i} className="flex gap-2 text-sm text-foreground-secondary">
                        <span className="text-dourado font-bold flex-shrink-0">{i + 1}.</span>
                        <span>{line.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!videoUrl && !instructions && (
                <div className="p-4 text-center text-foreground-muted text-sm">
                  Nenhuma instrução disponível para este exercício.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { YouTubeEmbed } from '@/components/shared/youtube-embed'

interface ExerciseVideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  exerciseName: string
}

export function ExerciseVideoModal({ isOpen, onClose, videoUrl, exerciseName }: ExerciseVideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-semibold truncate pr-4">{exerciseName}</h3>
              <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4">
              <YouTubeEmbed url={videoUrl} title={exerciseName} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

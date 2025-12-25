'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '@/hooks/use-offline'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOffline = useOffline()

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-warning/20 text-warning overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm">
            <WifiOff size={16} />
            <span>Você está offline. Algumas funções podem não funcionar.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function OfflineIndicator() {
  const isOffline = useOffline()

  if (!isOffline) return null

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="bg-warning/90 text-warning-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
      >
        <WifiOff size={14} />
        Offline
      </motion.div>
    </div>
  )
}

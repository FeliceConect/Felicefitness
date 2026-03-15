"use client"

import { motion } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-elevated flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-foreground-muted" />
        </motion.div>

        <h1 className="text-2xl font-butler font-bold text-foreground mb-3">
          Sem conexão
        </h1>

        <p className="text-foreground-secondary mb-8">
          Parece que você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>

        <Button
          onClick={handleRetry}
          className="bg-accent hover:bg-accent/90 text-white px-6 py-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>

        <p className="text-xs text-foreground-muted mt-8">
          Algumas funcionalidades podem estar disponíveis offline
        </p>
      </motion.div>
    </div>
  )
}

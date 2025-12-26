"use client"

import { motion } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-slate-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Sem conexao
        </h1>

        <p className="text-slate-400 mb-8">
          Parece que voce esta offline. Verifique sua conexao com a internet e tente novamente.
        </p>

        <Button
          onClick={handleRetry}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>

        <p className="text-xs text-slate-500 mt-8">
          Algumas funcionalidades podem estar disponiveis offline
        </p>
      </motion.div>
    </div>
  )
}

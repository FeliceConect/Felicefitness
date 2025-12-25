"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WATER_PRESETS } from '@/lib/water/types'
import { cn } from '@/lib/utils'

interface CustomAmountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (ml: number) => void
}

export function CustomAmountModal({
  isOpen,
  onClose,
  onConfirm
}: CustomAmountModalProps) {
  const [amount, setAmount] = useState(250)

  const handleIncrement = (value: number) => {
    setAmount(prev => Math.min(2000, prev + value))
  }

  const handleDecrement = (value: number) => {
    setAmount(prev => Math.max(50, prev - value))
  }

  const handlePresetSelect = (value: number) => {
    setAmount(value)
  }

  const handleConfirm = () => {
    if (amount >= 50 && amount <= 2000) {
      onConfirm(amount)
      onClose()
      setAmount(250) // Reset
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#14141F] rounded-t-3xl p-6 max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Adicionar Água</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Amount display */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDecrement(50)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <Minus className="w-6 h-6 text-slate-400" />
                </motion.button>

                <div className="text-center min-w-[120px]">
                  <motion.span
                    key={amount}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-cyan-400"
                  >
                    {amount}
                  </motion.span>
                  <span className="text-xl text-cyan-400 ml-1">ml</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleIncrement(50)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6 text-slate-400" />
                </motion.button>
              </div>

              {/* Slider visual */}
              <div className="mb-4">
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-6
                             [&::-webkit-slider-thumb]:h-6
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-cyan-500
                             [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:shadow-lg
                             [&::-webkit-slider-thumb]:shadow-cyan-500/50"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50ml</span>
                  <span>2L</span>
                </div>
              </div>

              {/* Presets */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Quantidades comuns</p>
                <div className="flex flex-wrap gap-2">
                  {WATER_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                        amount === preset
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {preset >= 1000 ? `${preset / 1000}L` : `${preset}ml`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions - Always visible at bottom with safe area */}
            <div className="flex gap-3 pt-4 flex-shrink-0 pb-20">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                size="lg"
                className="flex-1"
                onClick={handleConfirm}
              >
                Adicionar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

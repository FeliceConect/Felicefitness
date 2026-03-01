"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Check, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Food } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { calculateFoodMacros } from '@/lib/nutrition/calculations'
import { cn } from '@/lib/utils'

interface PortionSelectorProps {
  food: Food
  defaultQuantity?: number
  onConfirm: (quantity: number) => void
  onCancel: () => void
  onToggleFavorite?: () => void
}

// Porções genéricas em gramas (fallback quando não há porções comuns)
const defaultGramPortions = [50, 100, 150, 200, 250, 300]

export function PortionSelector({
  food,
  defaultQuantity,
  onConfirm,
  onCancel,
  onToggleFavorite
}: PortionSelectorProps) {
  const [quantity, setQuantity] = useState(defaultQuantity || food.porcao_padrao)

  // Calculate macros for current quantity
  const macros = useMemo(() => {
    return calculateFoodMacros(food, quantity)
  }, [food, quantity])

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta))
  }

  const categoryInfo = foodCategoryLabels[food.categoria]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom)+80px)] max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryInfo.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-foreground">{food.nome}</h3>
              {food.marca && (
                <p className="text-sm text-foreground-secondary">{food.marca}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Nutrition info per portion */}
        <div className="bg-white/50 rounded-xl p-4 mb-6">
          <p className="text-xs text-foreground-muted mb-2">
            Por {food.porcao_padrao}{food.unidade}
          </p>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{food.calorias}</p>
              <p className="text-xs text-foreground-secondary">kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-dourado">{food.proteinas}g</p>
              <p className="text-xs text-foreground-secondary">prot</p>
            </div>
            <div>
              <p className="text-lg font-bold text-dourado">{food.carboidratos}g</p>
              <p className="text-xs text-foreground-secondary">carb</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{food.gorduras}g</p>
              <p className="text-xs text-foreground-secondary">gord</p>
            </div>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="mb-6">
          <label className="text-sm text-foreground-secondary block mb-3">Quantidade</label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustQuantity(-10)}
              className="w-14 h-14 rounded-xl bg-white flex items-center justify-center hover:bg-background-elevated transition-colors"
            >
              <Minus className="w-6 h-6 text-foreground" />
            </button>
            <div className="w-32 text-center">
              <motion.span
                key={quantity}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-foreground"
              >
                {quantity}
              </motion.span>
              <span className="text-xl text-foreground-secondary ml-1">{food.unidade}</span>
            </div>
            <button
              onClick={() => adjustQuantity(10)}
              className="w-14 h-14 rounded-xl bg-white flex items-center justify-center hover:bg-background-elevated transition-colors"
            >
              <Plus className="w-6 h-6 text-foreground" />
            </button>
          </div>

          {/* Quick portions - Porções comuns ou fallback */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {food.porcoes_comuns && food.porcoes_comuns.length > 0 ? (
              // Mostrar porções comuns quando disponíveis
              food.porcoes_comuns.map((portion, index) => (
                <button
                  key={index}
                  onClick={() => setQuantity(portion.grams)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    quantity === portion.grams
                      ? 'bg-dourado text-white'
                      : portion.isDefault
                        ? 'bg-dourado/20 text-dourado border border-dourado/30 hover:bg-dourado/30'
                        : 'bg-white text-foreground-secondary hover:bg-background-elevated'
                  )}
                >
                  {portion.label}
                </button>
              ))
            ) : (
              // Fallback para porções genéricas em gramas
              defaultGramPortions.map(portion => (
                <button
                  key={portion}
                  onClick={() => setQuantity(portion)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    quantity === portion
                      ? 'bg-dourado text-white'
                      : 'bg-white text-foreground-secondary hover:bg-background-elevated'
                  )}
                >
                  {portion}{food.unidade}
                </button>
              ))
            )}
          </div>

          {/* Mostrar peso em gramas quando usando porções comuns */}
          {food.porcoes_comuns && food.porcoes_comuns.length > 0 && (
            <p className="text-center text-xs text-foreground-muted mt-2">
              = {quantity}{food.unidade}
            </p>
          )}
        </div>

        {/* Calculated macros */}
        <div className="bg-gradient-to-r from-dourado/10 to-dourado/5 border border-dourado/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-foreground-secondary mb-2">Total para {quantity}{food.unidade}</p>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">{macros.calorias}</p>
              <p className="text-xs text-foreground-secondary">kcal</p>
            </div>
            <div>
              <p className="text-xl font-bold text-dourado">{macros.proteinas}g</p>
              <p className="text-xs text-foreground-secondary">prot</p>
            </div>
            <div>
              <p className="text-xl font-bold text-dourado">{macros.carboidratos}g</p>
              <p className="text-xs text-foreground-secondary">carb</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-400">{macros.gorduras}g</p>
              <p className="text-xs text-foreground-secondary">gord</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="gradient"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => onConfirm(quantity)}
          >
            <Check className="w-5 h-5" />
            Adicionar
          </Button>
        </div>

        {/* Toggle favorite */}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-foreground-secondary hover:text-amber-400 transition-colors"
          >
            <Star className={cn(
              'w-4 h-4',
              food.is_favorite && 'text-amber-400 fill-amber-400'
            )} />
            {food.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

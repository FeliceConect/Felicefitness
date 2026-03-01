"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Check, AlertCircle } from 'lucide-react'
import type { FoodItemEditorProps, AnalyzedFoodItem } from '@/types/analysis'
import { ConfidenceIndicator } from './confidence-indicator'
import { cn } from '@/lib/utils'

const PORTION_PRESETS = [
  { label: '50g', value: 50 },
  { label: '100g', value: 100 },
  { label: '150g', value: 150 },
  { label: '200g', value: 200 },
  { label: '250g', value: 250 },
  { label: '300g', value: 300 }
]

export function FoodItemEditor({
  item,
  onSave,
  onDelete,
  onCancel
}: FoodItemEditorProps) {
  const [editedItem, setEditedItem] = useState<AnalyzedFoodItem>({ ...item })

  const handlePortionChange = (grams: number) => {
    // Recalcular macros proporcionalmente
    const ratio = grams / item.portion_grams

    setEditedItem({
      ...editedItem,
      portion_grams: grams,
      calories: Math.round(item.calories * ratio),
      protein: Math.round(item.protein * ratio * 10) / 10,
      carbs: Math.round(item.carbs * ratio * 10) / 10,
      fat: Math.round(item.fat * ratio * 10) / 10
    })
  }

  const handleSave = () => {
    onSave({ ...editedItem, edited: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-4 flex items-center justify-between">
          <button onClick={onCancel} className="p-2 text-foreground-secondary hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-foreground">Editar Alimento</h3>

          <button
            onClick={handleSave}
            className="p-2 text-emerald-400 hover:text-emerald-300"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Nome do alimento */}
          <div>
            <label className="text-sm text-foreground-secondary block mb-2">Nome do alimento</label>
            <input
              type="text"
              value={editedItem.name}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-dourado"
            />
          </div>

          {/* Confiança original */}
          <div className="flex items-center justify-between bg-background border border-border rounded-xl p-3">
            <span className="text-sm text-foreground-secondary">Confiança da IA</span>
            <ConfidenceIndicator level={item.confidence} showLabel />
          </div>

          {/* Porção */}
          <div>
            <label className="text-sm text-foreground-secondary block mb-2">Porção (gramas)</label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {PORTION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePortionChange(preset.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    editedItem.portion_grams === preset.value
                      ? 'bg-dourado text-white'
                      : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={editedItem.portion_grams}
              onChange={(e) => handlePortionChange(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-dourado"
            />
          </div>

          {/* Macros */}
          <div>
            <label className="text-sm text-foreground-secondary block mb-2">Valores nutricionais</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-xl p-3">
                <span className="text-xs text-foreground-muted block mb-1">Calorias</span>
                <input
                  type="number"
                  value={editedItem.calories}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, calories: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                />
                <span className="text-xs text-foreground-muted">kcal</span>
              </div>

              <div className="bg-background border border-border rounded-xl p-3">
                <span className="text-xs text-foreground-muted block mb-1">Proteína</span>
                <input
                  type="number"
                  step="0.1"
                  value={editedItem.protein}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, protein: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                />
                <span className="text-xs text-foreground-muted">g</span>
              </div>

              <div className="bg-background border border-border rounded-xl p-3">
                <span className="text-xs text-foreground-muted block mb-1">Carboidratos</span>
                <input
                  type="number"
                  step="0.1"
                  value={editedItem.carbs}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, carbs: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                />
                <span className="text-xs text-foreground-muted">g</span>
              </div>

              <div className="bg-background border border-border rounded-xl p-3">
                <span className="text-xs text-foreground-muted block mb-1">Gordura</span>
                <input
                  type="number"
                  step="0.1"
                  value={editedItem.fat}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, fat: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                />
                <span className="text-xs text-foreground-muted">g</span>
              </div>
            </div>
          </div>

          {/* Aviso de edição */}
          {editedItem.edited || item.edited ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este item foi editado manualmente</span>
            </div>
          ) : null}

          {/* Botão de excluir */}
          <button
            onClick={onDelete}
            className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Remover alimento
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Edit2,
  Plus,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { MealAnalysisResult, AnalyzedFoodItem } from '@/types/analysis'
import { ConfidenceIndicator } from './confidence-indicator'
import { FoodItemEditor } from './food-item-editor'
import { cn } from '@/lib/utils'

interface AnalysisResultProps {
  result: MealAnalysisResult
  imageUrl: string
  onEditItem: (id: string, data: Partial<AnalyzedFoodItem>) => void
  onRemoveItem: (id: string) => void
  onAddItem: () => void
  onSave: () => void
  onRetry: () => void
}

export function AnalysisResult({
  result,
  imageUrl,
  onEditItem,
  onRemoveItem,
  onAddItem,
  onSave,
  onRetry
}: AnalysisResultProps) {
  const [editingItem, setEditingItem] = useState<AnalyzedFoodItem | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleEditSave = (item: AnalyzedFoodItem) => {
    onEditItem(item.id, item)
    setEditingItem(null)
  }

  const handleEditDelete = () => {
    if (editingItem) {
      onRemoveItem(editingItem.id)
      setEditingItem(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      {/* Header com preview */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Refeição analisada"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
      </div>

      {/* Conteúdo */}
      <div className="px-4 -mt-16 relative">
        {/* Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-4 mb-4"
        >
          <p className="text-foreground-secondary text-sm mb-3">
            {result.meal_description || 'Refeição analisada'}
          </p>

          {/* Macros grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{result.totals.calories}</p>
              <p className="text-xs text-foreground-muted">kcal</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-dourado">{result.totals.protein.toFixed(0)}g</p>
              <p className="text-xs text-foreground-muted">prot</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-400">{result.totals.carbs.toFixed(0)}g</p>
              <p className="text-xs text-foreground-muted">carb</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-rose-400">{result.totals.fat.toFixed(0)}g</p>
              <p className="text-xs text-foreground-muted">gord</p>
            </div>
          </div>

          {/* Confiança geral */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-secondary">Confiança da análise</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence || 75}%` }}
                  className={cn(
                    'h-full rounded-full',
                    (result.confidence || 75) >= 80
                      ? 'bg-emerald-500'
                      : (result.confidence || 75) >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                />
              </div>
              <span className="text-sm text-foreground font-medium">
                {result.confidence || 75}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Alimentos identificados */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold">Alimentos identificados</h3>
            <span className="text-sm text-foreground-secondary">{result.items.length} itens</span>
          </div>

          <div className="space-y-2">
            {result.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground font-medium">{item.name}</h4>
                      {item.edited && (
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          editado
                        </span>
                      )}
                    </div>
                    <p className="text-foreground-secondary text-sm">
                      {item.portion_grams}g - {item.calories} kcal
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs">
                    <span className="text-dourado">P:{item.protein.toFixed(1)}g</span>
                    <span className="text-amber-400">C:{item.carbs.toFixed(1)}g</span>
                    <span className="text-rose-400">G:{item.fat.toFixed(1)}g</span>
                  </div>

                  <ConfidenceIndicator level={item.confidence} size="sm" />
                </div>

                {item.notes && (
                  <p className="text-foreground-muted text-xs mt-2 italic">{item.notes}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Adicionar item */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddItem}
            className="w-full mt-3 py-3 border-2 border-dashed border-border rounded-xl text-foreground-secondary hover:text-foreground hover:border-dourado/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar alimento
          </motion.button>
        </div>

        {/* Sugestões e Alertas */}
        {(result.suggestions.length > 0 || result.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full bg-white border border-border rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-dourado" />
                <span className="text-foreground font-medium">Sugestões da IA</span>
              </div>
              {showSuggestions ? (
                <ChevronUp className="w-5 h-5 text-foreground-secondary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-foreground-secondary" />
              )}
            </button>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="bg-dourado/10 border border-dourado/20 rounded-xl p-3 flex items-start gap-2"
                      >
                        <Lightbulb className="w-4 h-4 text-dourado flex-shrink-0 mt-0.5" />
                        <p className="text-dourado text-sm">{suggestion}</p>
                      </div>
                    ))}

                    {result.warnings.map((warning, i) => (
                      <div
                        key={i}
                        className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-300 text-sm">{warning}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Analisar novamente */}
        <button
          onClick={onRetry}
          className="w-full py-3 text-foreground-secondary hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Analisar outra foto
        </button>
      </div>

      {/* Botão fixo de salvar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-background via-background/95 to-transparent z-50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          className="w-full py-4 bg-gradient-to-r from-dourado to-dourado/70 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-dourado/20"
        >
          <Check className="w-5 h-5" />
          Salvar como Refeição
        </motion.button>
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editingItem && (
          <FoodItemEditor
            item={editingItem}
            onSave={handleEditSave}
            onDelete={handleEditDelete}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

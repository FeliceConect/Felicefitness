"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Flame, Beef, Wheat, Droplets, Check } from 'lucide-react'
import type { Food, FoodCategory } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { useFoods } from '@/hooks/use-foods'

interface AddCustomFoodModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (food: Food) => void
  initialName?: string
}

const CATEGORIES: FoodCategory[] = [
  'proteina', 'carboidrato', 'vegetal', 'fruta',
  'laticinio', 'gordura', 'bebida', 'outros'
]

export function AddCustomFoodModal({ isOpen, onClose, onSave, initialName = '' }: AddCustomFoodModalProps) {
  const { addFood } = useFoods()
  const [nome, setNome] = useState(initialName)
  const [categoria, setCategoria] = useState<FoodCategory>('outros')
  const [porcao, setPorcao] = useState('100')
  const [unidade, setUnidade] = useState<'g' | 'ml' | 'unidade'>('g')
  const [calorias, setCalorias] = useState('')
  const [proteinas, setProteinas] = useState('')
  const [carboidratos, setCarboidratos] = useState('')
  const [gorduras, setGorduras] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens with new name
  useEffect(() => {
    if (isOpen) {
      setNome(initialName)
      setSaveSuccess(false)
      setError(null)
    }
  }, [isOpen, initialName])

  const handleSave = async () => {
    if (!nome.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      // Salvar no banco de dados via hook
      const savedFood = await addFood({
        nome: nome.trim(),
        categoria,
        porcao_padrao: parseInt(porcao) || 100,
        unidade,
        calorias: parseInt(calorias) || 0,
        proteinas: parseFloat(proteinas) || 0,
        carboidratos: parseFloat(carboidratos) || 0,
        gorduras: parseFloat(gorduras) || 0,
        fibras: 0,
        is_user_created: true,
        is_favorite: false,
        source: 'manual'
      })

      setSaveSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        onSave(savedFood)
        onClose()

        // Reset form
        setNome('')
        setCalorias('')
        setProteinas('')
        setCarboidratos('')
        setGorduras('')
        setPorcao('100')
        setCategoria('outros')
        setUnidade('g')
        setSaveSuccess(false)
      }, 500)
    } catch (err) {
      setError('Erro ao salvar alimento. Tente novamente.')
      console.error('Erro ao salvar alimento:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Adicionar Alimento</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Nome do alimento *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Bolo de chocolate caseiro"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Categoria</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const catInfo = foodCategoryLabels[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoria(cat)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                        categoria === cat
                          ? 'bg-dourado/20 border border-dourado'
                          : 'bg-background border border-transparent hover:bg-background-elevated'
                      }`}
                    >
                      <span className="text-lg">{catInfo.icon}</span>
                      <span className="text-[10px] text-foreground-secondary text-center truncate w-full">
                        {catInfo.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Porcao e Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground-secondary block mb-2">Porcao</label>
                <input
                  type="number"
                  value={porcao}
                  onChange={(e) => setPorcao(e.target.value)}
                  placeholder="100"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                />
              </div>
              <div>
                <label className="text-sm text-foreground-secondary block mb-2">Unidade</label>
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value as 'g' | 'ml' | 'unidade')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-dourado"
                >
                  <option value="g">gramas (g)</option>
                  <option value="ml">mililitros (ml)</option>
                  <option value="unidade">unidades</option>
                </select>
              </div>
            </div>

            {/* Macros */}
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">
                Informacoes nutricionais (por porcao)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Calorias */}
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-foreground-secondary">Calorias</span>
                  </div>
                  <input
                    type="number"
                    value={calorias}
                    onChange={(e) => setCalorias(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                  />
                  <span className="text-xs text-foreground-muted">kcal</span>
                </div>

                {/* Proteinas */}
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Beef className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-foreground-secondary">Proteinas</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinas}
                    onChange={(e) => setProteinas(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                  />
                  <span className="text-xs text-foreground-muted">g</span>
                </div>

                {/* Carboidratos */}
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wheat className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-foreground-secondary">Carboidratos</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={carboidratos}
                    onChange={(e) => setCarboidratos(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                  />
                  <span className="text-xs text-foreground-muted">g</span>
                </div>

                {/* Gorduras */}
                <div className="bg-background border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-foreground-secondary">Gorduras</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={gorduras}
                    onChange={(e) => setGorduras(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-foreground text-lg font-bold focus:outline-none"
                  />
                  <span className="text-xs text-foreground-muted">g</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-foreground-muted">
              Dica: Se nao souber os valores exatos, pesquise na internet ou use valores aproximados.
            </p>

            {/* Success message */}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 text-sm">Alimento salvo com sucesso!</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-background text-foreground-secondary rounded-xl font-medium hover:bg-background-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!nome.trim() || isSaving}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                nome.trim() && !isSaving
                  ? 'bg-dourado text-white hover:bg-dourado/80'
                  : 'bg-background-elevated text-foreground-secondary cursor-not-allowed'
              } transition-colors`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

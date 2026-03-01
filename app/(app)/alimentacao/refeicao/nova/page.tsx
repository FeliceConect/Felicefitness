"use client"

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash2, Camera, Clock, Save, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { FoodSearch } from '@/components/alimentacao/food-search'
import { PortionSelector } from '@/components/alimentacao/portion-selector'
import { AddCustomFoodModal } from '@/components/alimentacao/add-custom-food-modal'
import type { Food, MealItem, MealType } from '@/lib/nutrition/types'
import { mealTypeLabels, mealTypeIcons } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { calculateFoodMacros } from '@/lib/nutrition/calculations'
import { useFoods } from '@/hooks/use-foods'
import { useDailyMeals } from '@/hooks/use-daily-meals'
import { cn } from '@/lib/utils'

const mealTypes: MealType[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'pre_treino',
  'jantar',
  'ceia'
]

function NewMealContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToRecent, toggleFavorite } = useFoods()
  const { addMeal } = useDailyMeals()

  // Get meal type and planMealId from URL params
  const initialType = (searchParams.get('tipo') as MealType) || 'almoco'
  const planMealId = searchParams.get('planMealId')

  const [selectedType, setSelectedType] = useState<MealType>(initialType)
  const [items, setItems] = useState<MealItem[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [horario, setHorario] = useState(format(new Date(), 'HH:mm'))
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false)
  const [customFoodName, setCustomFoodName] = useState('')

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )
  }, [items])

  // Handle food selection
  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
  }

  // Handle portion confirm
  const handlePortionConfirm = (quantity: number) => {
    if (!selectedFood) return

    const macros = calculateFoodMacros(selectedFood, quantity)
    const newItem: MealItem = {
      id: `item-${Date.now()}`,
      food_id: selectedFood.id,
      food: selectedFood,
      quantidade: quantity,
      calorias: macros.calorias,
      proteinas: macros.proteinas,
      carboidratos: macros.carboidratos,
      gorduras: macros.gorduras
    }

    setItems(prev => [...prev, newItem])
    addToRecent(selectedFood.id)
    setSelectedFood(null)
  }

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Handle toggle favorite
  const handleToggleFavorite = () => {
    if (selectedFood) {
      toggleFavorite(selectedFood.id)
    }
  }

  // Handle add custom food
  const handleAddCustomFood = (name: string) => {
    setCustomFoodName(name)
    setShowCustomFoodModal(true)
  }

  // Handle custom food saved
  const handleCustomFoodSaved = (food: Food) => {
    // Select the new custom food to allow portion selection
    setSelectedFood(food)
    setShowCustomFoodModal(false)
    setCustomFoodName('')
  }

  // Handle save
  const handleSave = async () => {
    if (items.length === 0) return

    setSaving(true)
    try {
      // If coming from meal plan, use the API to link custom foods to the plan
      if (planMealId) {
        // Convert items to the format expected by the API
        const completedFoods = items.map(item => ({
          name: item.food?.nome || 'Alimento',
          quantity: item.quantidade,
          unit: item.food?.unidade || 'g',
          calories: item.calorias,
          protein: item.proteinas,
          carbs: item.carboidratos,
          fat: item.gorduras
        }))

        const response = await fetch('/api/client/meal-plan/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planMealId,
            date: format(new Date(), 'yyyy-MM-dd'),
            completedFoods,
            notes: notas || `Refeição personalizada às ${horario}`
          })
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Erro ao salvar refeição')
        }
      } else {
        // No plan meal ID, save as independent meal
        await addMeal({
          user_id: 'mock-user',
          tipo: selectedType,
          data: format(new Date(), 'yyyy-MM-dd'),
          horario_planejado: horario,
          horario_real: format(new Date(), 'HH:mm'),
          status: 'concluido',
          itens: items,
          calorias_total: totals.calorias,
          proteinas_total: totals.proteinas,
          carboidratos_total: totals.carboidratos,
          gorduras_total: totals.gorduras,
          notas: notas || undefined
        })
      }
      router.push('/alimentacao')
    } catch (error) {
      console.error('Error saving meal:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground">Nova Refeição</h1>
      </div>

      {/* Meal type selector */}
      <div className="px-4 mb-6">
        <label className="text-sm text-foreground-secondary block mb-2">Tipo de refeição</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {mealTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
                selectedType === type
                  ? 'bg-dourado text-white'
                  : 'bg-white text-foreground-secondary hover:bg-background-elevated'
              )}
            >
              <span>{mealTypeIcons[type]}</span>
              <span className="text-sm font-medium">{mealTypeLabels[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time selector */}
      <div className="px-4 mb-6">
        <label className="text-sm text-foreground-secondary block mb-2">Horário</label>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-foreground-muted" />
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="bg-white border border-border rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-dourado"
          />
        </div>
      </div>

      {/* Added items */}
      {items.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
              Alimentos ({items.length})
            </h3>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => {
              const categoryInfo = foodCategoryLabels[item.food.categoria]
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl"
                >
                  <span className="text-xl">{categoryInfo.icon}</span>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{item.food.nome}</p>
                    <p className="text-sm text-foreground-secondary">
                      {item.quantidade}{item.food.unidade} • {item.calorias} kcal • {item.proteinas}g prot
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="mt-4 p-4 bg-gradient-to-r from-dourado/10 to-dourado/5 border border-dourado/20 rounded-xl">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{Math.round(totals.calorias)}</p>
                <p className="text-xs text-foreground-secondary">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-dourado">{Math.round(totals.proteinas)}g</p>
                <p className="text-xs text-foreground-secondary">prot</p>
              </div>
              <div>
                <p className="text-lg font-bold text-dourado">{Math.round(totals.carboidratos)}g</p>
                <p className="text-xs text-foreground-secondary">carb</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">{Math.round(totals.gorduras)}g</p>
                <p className="text-xs text-foreground-secondary">gord</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Food search */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
          Adicionar Alimentos
        </h3>
        <FoodSearch
          onSelect={handleFoodSelect}
          excludeIds={items.map(i => i.food_id)}
          onAddCustomFood={handleAddCustomFood}
          showAddCustom={true}
        />
      </div>

      {/* AI Analysis option */}
      <div className="px-4 mb-6">
        <Link href="/alimentacao/analisar">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-dourado/20 to-dourado/10 border border-dourado/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-dourado to-dourado/70 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-semibold mb-1">Analisar com IA</p>
                <p className="text-foreground-secondary text-sm">
                  Tire uma foto e a IA identifica os alimentos e macros automaticamente
                </p>
              </div>
              <div className="text-dourado">
                <Camera className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      <div className="px-4 mb-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-foreground-muted text-sm">ou adicione manualmente</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Notes */}
      <div className="px-4 mb-6">
        <label className="text-sm text-foreground-secondary block mb-2">Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ex: Antes do treino, pós jejum..."
          className="w-full bg-white border border-border rounded-xl p-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado resize-none"
          rows={2}
        />
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-40">
        <Button
          variant="gradient"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={items.length === 0 || saving}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Refeição'}
        </Button>
      </div>

      {/* Portion selector modal */}
      <AnimatePresence>
        {selectedFood && (
          <PortionSelector
            food={selectedFood}
            onConfirm={handlePortionConfirm}
            onCancel={() => setSelectedFood(null)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </AnimatePresence>

      {/* Custom food modal */}
      <AddCustomFoodModal
        isOpen={showCustomFoodModal}
        onClose={() => {
          setShowCustomFoodModal(false)
          setCustomFoodName('')
        }}
        onSave={handleCustomFoodSaved}
        initialName={customFoodName}
      />
    </div>
  )
}

export default function NewMealPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-foreground-secondary">Carregando...</div></div>}>
      <NewMealContent />
    </Suspense>
  )
}

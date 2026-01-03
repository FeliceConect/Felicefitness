"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Clock, Plus, Camera, Trash2, ChevronDown, ChevronUp, Link2, X } from 'lucide-react'
import { format } from 'date-fns'
import { AIMealAnalyzer } from '@/components/alimentacao/ai-meal-analyzer'
import type { MealAnalysisResult, AnalyzedFoodItem } from '@/types/analysis'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Meal, MealInsert } from '@/types/database'
import type { MealType, Food } from '@/lib/nutrition/types'
import { Suspense } from 'react'
import { FoodSearch } from '@/components/alimentacao/food-search'
import { AddCustomFoodModal } from '@/components/alimentacao/add-custom-food-modal'

// Interface para um prato/foto analisado
interface AnalyzedPlate {
  id: string
  description: string
  items: AnalyzedFoodItem[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

// Tipos de refeição - usar os mesmos tipos do sistema
const MEAL_TYPES: Array<{ id: MealType; label: string; icon: string }> = [
  { id: 'cafe_manha', label: 'Café da manhã', icon: '☕' },
  { id: 'lanche_manha', label: 'Lanche manhã', icon: '🍎' },
  { id: 'almoco', label: 'Almoço', icon: '🍽️' },
  { id: 'lanche_tarde', label: 'Lanche tarde', icon: '🥪' },
  { id: 'pre_treino', label: 'Pré-Treino', icon: '💪' },
  { id: 'jantar', label: 'Jantar', icon: '🌙' },
  { id: 'ceia', label: 'Ceia', icon: '🌜' }
]

type Step = 'analyze' | 'confirm'

// Componente interno que usa useSearchParams
function AnalisarRefeicaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)

  // Parâmetros do plano alimentar (quando vindo de uma refeição do plano)
  const planMealId = searchParams.get('planMealId')
  const planMealType = searchParams.get('tipo')
  // ID de uma refeição existente para adicionar mais alimentos
  const existingMealId = searchParams.get('mealId')

  const [step, setStep] = useState<Step>('analyze')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType>((planMealType as MealType) || 'almoco')
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealTime, setMealTime] = useState(format(new Date(), 'HH:mm'))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Estado para múltiplos pratos
  const [plates, setPlates] = useState<AnalyzedPlate[]>([])
  const [expandedPlates, setExpandedPlates] = useState<Set<string>>(new Set())

  // Estado para modal de adicionar item
  const [addingToPlateId, setAddingToPlateId] = useState<string | null>(null)
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false)
  const [customFoodName, setCustomFoodName] = useState('')

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  // Se veio do plano, usar o tipo de refeição correto
  useEffect(() => {
    if (planMealType) {
      // Mapear tipos do plano para tipos internos
      const typeMap: Record<string, MealType> = {
        'breakfast': 'cafe_manha',
        'morning_snack': 'lanche_manha',
        'lunch': 'almoco',
        'afternoon_snack': 'lanche_tarde',
        'pre_workout': 'pre_treino',
        'dinner': 'jantar',
        'supper': 'ceia'
      }
      const mappedType = typeMap[planMealType] || planMealType as MealType
      setSelectedMealType(mappedType)
    }
  }, [planMealType])

  // Quando análise é concluída
  const handleAnalysisComplete = (result: MealAnalysisResult) => {
    console.log('=== ANÁLISE CONCLUÍDA ===')
    console.log('result:', result)
    console.log('result.items:', result.items)
    console.log('result.items.length:', result.items?.length)

    // Criar um novo prato com os resultados da análise
    const newPlate: AnalyzedPlate = {
      id: `plate-${Date.now()}`,
      description: result.meal_description || `Prato ${plates.length + 1}`,
      items: result.items,
      totals: result.totals
    }

    console.log('newPlate criado:', newPlate)

    // Adicionar à lista de pratos
    setPlates(prev => {
      const updated = [...prev, newPlate]
      console.log('Plates atualizados:', updated)
      return updated
    })
    setAnalysisResult(result)
    setStep('confirm')

    // Expandir o novo prato
    setExpandedPlates(prev => new Set([...Array.from(prev), newPlate.id]))

    // Tentar identificar tipo de refeição pelo horário (só na primeira análise)
    if (plates.length === 0) {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 10) setSelectedMealType('cafe_manha')
      else if (hour >= 10 && hour < 12) setSelectedMealType('lanche_manha')
      else if (hour >= 12 && hour < 15) setSelectedMealType('almoco')
      else if (hour >= 15 && hour < 18) setSelectedMealType('lanche_tarde')
      else if (hour >= 18 && hour < 21) setSelectedMealType('jantar')
      else setSelectedMealType('ceia')
    }
  }

  // Adicionar outro prato (voltar para análise)
  const handleAddAnotherPlate = () => {
    setAnalysisResult(null)
    setStep('analyze')
  }

  // Remover um prato
  const handleRemovePlate = (plateId: string) => {
    setPlates(prev => prev.filter(p => p.id !== plateId))
    setExpandedPlates(prev => {
      const newSet = new Set(prev)
      newSet.delete(plateId)
      return newSet
    })
  }

  // Toggle expandir/colapsar prato
  const togglePlateExpand = (plateId: string) => {
    setExpandedPlates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(plateId)) {
        newSet.delete(plateId)
      } else {
        newSet.add(plateId)
      }
      return newSet
    })
  }

  // Remover um item específico de um prato
  const handleRemoveItem = (plateId: string, itemId: string) => {
    setPlates(prev => prev.map(plate => {
      if (plate.id !== plateId) return plate

      const newItems = plate.items.filter(item => item.id !== itemId)

      // Recalcular totais
      const newTotals = newItems.reduce(
        (acc, item) => ({
          calories: acc.calories + (item.calories || 0),
          protein: acc.protein + (item.protein || 0),
          carbs: acc.carbs + (item.carbs || 0),
          fat: acc.fat + (item.fat || 0)
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )

      return { ...plate, items: newItems, totals: newTotals }
    }).filter(plate => plate.items.length > 0)) // Remove prato se ficar vazio
  }

  // Adicionar item do banco de dados ao prato
  const handleAddFoodToPlate = (food: Food) => {
    if (!addingToPlateId) return

    // Converter Food para AnalyzedFoodItem
    const newItem: AnalyzedFoodItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: food.nome,
      portion_grams: food.porcao_padrao,
      calories: food.calorias,
      protein: food.proteinas,
      carbs: food.carboidratos,
      fat: food.gorduras,
      confidence: 'alto', // Items do banco são confiáveis
      notes: `Porção padrão: ${food.porcao_padrao}${food.unidade}`,
      edited: false
    }

    setPlates(prev => prev.map(plate => {
      if (plate.id !== addingToPlateId) return plate

      const newItems = [...plate.items, newItem]

      // Recalcular totais
      const newTotals = {
        calories: plate.totals.calories + newItem.calories,
        protein: plate.totals.protein + newItem.protein,
        carbs: plate.totals.carbs + newItem.carbs,
        fat: plate.totals.fat + newItem.fat
      }

      return { ...plate, items: newItems, totals: newTotals }
    }))

    setAddingToPlateId(null)
  }

  // Callback para adicionar alimento customizado
  const handleAddCustomFood = (name: string) => {
    setCustomFoodName(name)
    setShowCustomFoodModal(true)
  }

  // Quando alimento customizado é salvo
  const handleCustomFoodSaved = (food: Food) => {
    handleAddFoodToPlate(food)
    setShowCustomFoodModal(false)
    setCustomFoodName('')
  }

  // Calcular totais combinados de todos os pratos
  const combinedTotals = plates.reduce(
    (acc, plate) => ({
      calories: acc.calories + plate.totals.calories,
      protein: acc.protein + plate.totals.protein,
      carbs: acc.carbs + plate.totals.carbs,
      fat: acc.fat + plate.totals.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Todos os itens combinados
  const allItems = plates.flatMap(plate => plate.items)

  // Cancelar análise
  const handleCancel = () => {
    router.back()
  }

  // Voltar para análise
  const handleBackToAnalysis = () => {
    setStep('analyze')
  }

  // Salvar refeição
  const handleSave = async () => {
    console.log('=== INICIANDO SALVAMENTO ===')
    console.log('plates:', plates)
    console.log('planMealId:', planMealId)
    console.log('existingMealId:', existingMealId)

    if (plates.length === 0 || !user) {
      console.log('Saindo: plates.length === 0 ou !user')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // Se veio de uma refeição existente, adicionar os itens a ela
      if (existingMealId) {
        console.log('=== ADICIONANDO A REFEIÇÃO EXISTENTE ===')
        const supabase = createClient()

        // Buscar dados atuais da refeição
        const { data: currentMealData, error: fetchError } = await supabase
          .from('fitness_meals')
          .select('calorias_total, proteinas_total, carboidratos_total, gorduras_total')
          .eq('id', existingMealId)
          .single()

        if (fetchError) {
          throw new Error('Erro ao buscar refeição existente: ' + fetchError.message)
        }

        const currentMeal = currentMealData as {
          calorias_total: number | null
          proteinas_total: number | null
          carboidratos_total: number | null
          gorduras_total: number | null
        } | null

        // Adicionar novos itens
        for (const item of allItems) {
          const { error: itemError } = await supabase
            .from('fitness_meal_items')
            .insert({
              meal_id: existingMealId,
              nome_alimento: item.name || 'Alimento',
              quantidade: Math.round(item.portion_grams || 100),
              unidade: 'g',
              calorias: Math.round(item.calories || 0),
              proteinas: Math.round(item.protein || 0),
              carboidratos: Math.round(item.carbs || 0),
              gorduras: Math.round(item.fat || 0)
            } as never)

          if (itemError) {
            throw new Error(`Erro ao adicionar item "${item.name}": ${itemError.message}`)
          }
        }

        // Atualizar totais da refeição
        const newTotals = {
          calorias_total: (currentMeal?.calorias_total || 0) + combinedTotals.calories,
          proteinas_total: (currentMeal?.proteinas_total || 0) + combinedTotals.protein,
          carboidratos_total: (currentMeal?.carboidratos_total || 0) + combinedTotals.carbs,
          gorduras_total: (currentMeal?.gorduras_total || 0) + combinedTotals.fat
        }

        const { error: updateError } = await supabase
          .from('fitness_meals')
          .update(newTotals as never)
          .eq('id', existingMealId)

        if (updateError) {
          throw new Error('Erro ao atualizar totais: ' + updateError.message)
        }

        console.log('=== ITENS ADICIONADOS À REFEIÇÃO EXISTENTE ===')
        router.push(`/alimentacao/refeicao/${existingMealId}`)
        return
      }

      // Se veio de uma refeição do plano, usar a API do meal-plan/complete
      if (planMealId) {
        console.log('=== SALVANDO VINCULADO AO PLANO ===')

        // Converter items para o formato esperado pela API
        const completedFoods = allItems.map(item => ({
          name: item.name || 'Alimento',
          quantity: Math.round(item.portion_grams || 100),
          unit: 'g',
          calories: Math.round(item.calories || 0),
          protein: Math.round(item.protein || 0),
          carbs: Math.round(item.carbs || 0),
          fat: Math.round(item.fat || 0)
        }))

        const combinedDescription = plates.length > 1
          ? `Refeição com ${plates.length} pratos: ${plates.map(p => p.description).join(', ')}`
          : plates[0].description || 'Refeição analisada por IA'

        const response = await fetch('/api/client/meal-plan/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planMealId,
            date: mealDate,
            completedFoods,
            notes: `${combinedDescription} (Analisado por IA às ${mealTime})`
          })
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Erro ao salvar refeição no plano')
        }

        console.log('=== REFEIÇÃO SALVA NO PLANO ===')
      } else {
        // Salvar como refeição independente (fluxo original)
        console.log('=== SALVANDO COMO REFEIÇÃO INDEPENDENTE ===')
        const supabase = createClient()

        const combinedDescription = plates.length > 1
          ? `Refeição com ${plates.length} pratos: ${plates.map(p => p.description).join(', ')}`
          : plates[0].description || 'Refeição analisada por IA'

        const mealData: MealInsert = {
          user_id: user.id,
          data: mealDate,
          horario: mealTime,
          tipo_refeicao: selectedMealType,
          analise_ia: combinedDescription,
          calorias_total: combinedTotals.calories,
          proteinas_total: combinedTotals.protein,
          carboidratos_total: combinedTotals.carbs,
          gorduras_total: combinedTotals.fat,
          status: 'concluido'
        }

        const { data, error: mealError } = await supabase
          .from('fitness_meals')
          .insert(mealData as never)
          .select()
          .single()

        const meal = data as Meal | null

        if (mealError) {
          console.error('Erro ao criar refeição:', mealError)
          throw new Error('Erro ao salvar refeição: ' + mealError.message)
        }

        // Criar os itens
        if (meal && allItems.length > 0) {
          for (const item of allItems) {
            const { error: itemError } = await supabase
              .from('fitness_meal_items')
              .insert({
                meal_id: meal.id,
                nome_alimento: item.name || 'Alimento',
                quantidade: Math.round(item.portion_grams || 100),
                unidade: 'g',
                calorias: Math.round(item.calories || 0),
                proteinas: Math.round(item.protein || 0),
                carboidratos: Math.round(item.carbs || 0),
                gorduras: Math.round(item.fat || 0)
              } as never)

            if (itemError) {
              throw new Error(`Erro ao salvar item "${item.name}": ${itemError.message}`)
            }
          }
        }
      }

      // Redirecionar para a página de alimentação
      router.push('/alimentacao')
    } catch (error) {
      console.error('Erro ao salvar refeição:', error)
      setSaveError(error instanceof Error ? error.message : 'Erro ao salvar refeição')
    } finally {
      setIsSaving(false)
    }
  }

  // Renderizar etapa de análise
  if (step === 'analyze') {
    return (
      <AIMealAnalyzer
        onAnalysisComplete={handleAnalysisComplete}
        onCancel={handleCancel}
      />
    )
  }

  // Renderizar etapa de confirmação
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-48">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={handleBackToAnalysis}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Confirmar Refeição</h1>
        <p className="text-slate-400 text-sm">
          Revise os dados e salve sua refeição
        </p>
      </div>

      {/* Totais combinados (quando há pratos) */}
      {plates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-6"
        >
          <div className="bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium">
                Total da Refeição
              </p>
              <span className="text-xs text-slate-400 bg-[#0A0A0F] px-2 py-1 rounded-lg">
                {plates.length} {plates.length === 1 ? 'prato' : 'pratos'}
              </span>
            </div>

            {/* Macros combinados */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#0A0A0F]/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">
                  {combinedTotals.calories}
                </p>
                <p className="text-xs text-slate-500">kcal</p>
              </div>
              <div className="bg-[#0A0A0F]/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-cyan-400">
                  {combinedTotals.protein.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">prot</p>
              </div>
              <div className="bg-[#0A0A0F]/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-400">
                  {combinedTotals.carbs.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">carb</p>
              </div>
              <div className="bg-[#0A0A0F]/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-rose-400">
                  {combinedTotals.fat.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">gord</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de pratos */}
      {plates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="px-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-slate-400">Pratos analisados</label>
            <button
              onClick={handleAddAnotherPlate}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar prato
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {plates.map((plate, index) => (
                <motion.div
                  key={plate.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl overflow-hidden"
                >
                  {/* Header do prato */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => togglePlateExpand(plate.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-violet-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{plate.description}</p>
                        <p className="text-xs text-slate-500">
                          {plate.totals.calories} kcal · {plate.items.length} itens
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePlate(plate.id)
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedPlates.has(plate.id) ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  <AnimatePresence>
                    {expandedPlates.has(plate.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-[#2E2E3E]">
                          {/* Macros do prato */}
                          <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                            <div className="bg-[#0A0A0F] rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-white">{plate.totals.calories}</p>
                              <p className="text-[10px] text-slate-500">kcal</p>
                            </div>
                            <div className="bg-[#0A0A0F] rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-cyan-400">{plate.totals.protein.toFixed(0)}g</p>
                              <p className="text-[10px] text-slate-500">prot</p>
                            </div>
                            <div className="bg-[#0A0A0F] rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-amber-400">{plate.totals.carbs.toFixed(0)}g</p>
                              <p className="text-[10px] text-slate-500">carb</p>
                            </div>
                            <div className="bg-[#0A0A0F] rounded-lg p-2 text-center">
                              <p className="text-sm font-bold text-rose-400">{plate.totals.fat.toFixed(0)}g</p>
                              <p className="text-[10px] text-slate-500">gord</p>
                            </div>
                          </div>

                          {/* Itens do prato com botões de deletar */}
                          <div className="space-y-2">
                            {plate.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-[#1E1E2E] rounded-lg group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-300 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {item.portion_grams}g • {item.calories} kcal
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveItem(plate.id, item.id)
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2"
                                  title="Remover item"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            {/* Botão para adicionar item */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setAddingToPlateId(plate.id)
                              }}
                              className="w-full p-2 border border-dashed border-[#3E3E4E] rounded-lg text-slate-400 hover:border-violet-500/50 hover:text-violet-400 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar alimento
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Botão grande para adicionar outro prato */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleAddAnotherPlate}
            className="w-full mt-3 p-4 border-2 border-dashed border-[#2E2E3E] rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-violet-500/50 hover:text-violet-400 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Fotografar outro prato</span>
          </motion.button>
        </motion.div>
      )}

      {/* Tipo de refeição */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-6"
      >
        <label className="text-sm text-slate-400 block mb-3">Tipo de refeição</label>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedMealType(type.id)}
              className={cn(
                'p-3 rounded-xl border transition-colors text-center',
                selectedMealType === type.id
                  ? 'bg-violet-500/20 border-violet-500 text-white'
                  : 'bg-[#14141F] border-[#2E2E3E] text-slate-400 hover:border-violet-500/50'
              )}
            >
              <span className="text-2xl block mb-1">{type.icon}</span>
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data e hora */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-6"
      >
        <label className="text-sm text-slate-400 block mb-3">Data e horário</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3">
            <input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full bg-transparent text-white focus:outline-none"
            />
          </div>
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Indicador de vinculação ao plano */}
      {planMealId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-4"
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <Link2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 text-sm font-medium">Vinculado ao plano alimentar</p>
              <p className="text-slate-400 text-xs">Esta refeição será salva no seu plano</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Indicador de adição a refeição existente */}
      {existingMealId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-4"
        >
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 flex items-center gap-3">
            <Plus className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-violet-400 text-sm font-medium">Adicionando à refeição existente</p>
              <p className="text-slate-400 text-xs">Os itens serão adicionados à refeição já salva</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Erro de salvamento */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-4"
        >
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        </motion.div>
      )}

      {/* Botão fixo de salvar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent z-50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving || plates.length === 0}
          className={cn(
            'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg',
            isSaving || plates.length === 0
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : planMealId
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-green-500/20'
                : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-500/20'
          )}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {planMealId ? 'Salvar no Plano' : 'Salvar Refeição'} {plates.length > 1 && `(${plates.length} pratos)`}
            </>
          )}
        </motion.button>
      </div>

      {/* Modal de adicionar alimento */}
      <AnimatePresence>
        {addingToPlateId && !showCustomFoodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setAddingToPlateId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-[#14141F] rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Adicionar Alimento</h2>
                <button
                  onClick={() => setAddingToPlateId(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Info sobre cálculo automático */}
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-4">
                <p className="text-violet-300 text-sm">
                  Selecione um alimento e os macros serão calculados automaticamente com base na porção padrão.
                </p>
              </div>

              {/* Busca de alimentos */}
              <FoodSearch
                onSelect={handleAddFoodToPlate}
                onAddCustomFood={handleAddCustomFood}
                showAddCustom={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de alimento customizado */}
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

// Componente principal com Suspense
export default function AnalisarRefeicaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <AnalisarRefeicaoContent />
    </Suspense>
  )
}

"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Flame,
  ArrowRightLeft,
  Plus,
  Utensils,
  User,
  Camera,
  Edit2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Food {
  name: string
  quantity: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

// Dados da refeição realmente consumida
interface CompletedMealData {
  id: string
  meal_type: string
  time: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  foods: Food[]
  notes?: string
}

interface MealAlternative {
  option: string  // "B", "C", "D", "E"
  name: string    // "Café com pasta de amendoim"
  foods: Food[]
}

interface PlannedMeal {
  id: string
  meal_type: string
  meal_name?: string
  scheduled_time?: string
  foods: Food[]
  total_calories?: number
  total_protein?: number
  total_carbs?: number
  total_fat?: number
  instructions?: string
  alternatives?: MealAlternative[] | Food[][]  // Support both formats
  is_completed?: boolean
}

interface MealPlanDay {
  id: string
  day_of_week: number
  day_name?: string
  meals: PlannedMeal[]
}

interface MealPlan {
  id: string
  name: string
  professional?: {
    display_name?: string
    specialty?: string
  }
  days: MealPlanDay[]
}

interface MealPlanCardProps {
  plan: MealPlan
  todayMeals: PlannedMeal[]
  completedMealIds: string[]
  completedMealsData?: Record<string, CompletedMealData> // Dados das refeições realmente consumidas
  isTrainingDay?: boolean
  onCompleteMeal: (meal: PlannedMeal, useAlternative?: number) => void
  onAddDifferentMeal: () => void
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Café da Manhã',
  morning_snack: 'Lanche da Manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da Tarde',
  dinner: 'Jantar',
  supper: 'Ceia'
}

const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  morning_snack: '🍎',
  lunch: '🍽️',
  afternoon_snack: '🥪',
  dinner: '🌙',
  supper: '🌜'
}

export function MealPlanCard({
  plan,
  todayMeals,
  completedMealIds,
  completedMealsData = {},
  isTrainingDay = false,
  onCompleteMeal,
  onAddDifferentMeal
}: MealPlanCardProps) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null)
  const router = useRouter()

  // Verificar por meal_type OU por id
  const completedCount = todayMeals.filter(m =>
    completedMealIds.includes(m.meal_type) || completedMealIds.includes(m.id)
  ).length
  const totalCount = todayMeals.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-green-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{plan.name}</h3>
              {plan.professional && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {plan.professional.display_name || 'Nutricionista'}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">{completedCount}/{totalCount}</p>
            <p className="text-xs text-slate-400">refeições</p>
          </div>
        </div>

        {/* Training Day Indicator */}
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
          isTrainingDay
            ? 'bg-violet-500/10 border border-violet-500/20'
            : 'bg-slate-800/50 border border-slate-700/50'
        }`}>
          <span className="text-lg">{isTrainingDay ? '💪' : '😴'}</span>
          <span className={`text-sm font-medium ${isTrainingDay ? 'text-violet-400' : 'text-slate-400'}`}>
            {isTrainingDay ? 'Dia de Treino' : 'Dia de Descanso'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Meals List */}
      <div className="divide-y divide-green-500/10">
        {todayMeals.map((meal) => {
          // Verificar se está completo por meal_type (mais robusto)
          const isCompleted = completedMealIds.includes(meal.meal_type) || completedMealIds.includes(meal.id)
          const isExpanded = expandedMeal === meal.id
          const hasAlternatives = meal.alternatives && meal.alternatives.length > 0

          // Obter dados da refeição realmente consumida (se existir)
          const actualMealData = completedMealsData[meal.meal_type]
          const displayFoods = isCompleted && actualMealData?.foods?.length > 0
            ? actualMealData.foods
            : meal.foods
          const displayCalories = isCompleted && actualMealData
            ? actualMealData.total_calories
            : meal.total_calories
          const displayProtein = isCompleted && actualMealData
            ? actualMealData.total_protein
            : meal.total_protein
          const displayCarbs = isCompleted && actualMealData
            ? actualMealData.total_carbs
            : meal.total_carbs
          const displayFat = isCompleted && actualMealData
            ? actualMealData.total_fat
            : meal.total_fat
          const isCustomMeal = isCompleted && actualMealData?.foods?.length > 0

          return (
            <div key={meal.id} className={`${isCompleted ? 'bg-green-500/5' : ''}`}>
              {/* Meal Header */}
              <button
                onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {MEAL_TYPE_ICONS[meal.meal_type] || '🍴'}
                  </span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                        {meal.meal_name || MEAL_TYPE_LABELS[meal.meal_type]}
                      </span>
                      {isCompleted && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                          Feita
                        </span>
                      )}
                    </div>
                    {meal.scheduled_time && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meal.scheduled_time}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {displayCalories && displayCalories > 0 && (
                    <span className="text-sm text-orange-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {displayCalories} kcal
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Foods List */}
                      <div className={`rounded-lg p-3 space-y-2 ${
                        isCustomMeal ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-slate-800/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-400 uppercase">Alimentos</p>
                          {isCustomMeal && (
                            <span className="text-xs text-violet-400 px-2 py-0.5 bg-violet-500/20 rounded">
                              Personalizada
                            </span>
                          )}
                        </div>
                        {displayFoods?.map((food, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{food.name}</span>
                            <span className="text-slate-400">
                              {food.quantity}{food.unit} • {food.calories || 0} kcal
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Macros */}
                      {(displayProtein || displayCarbs || displayFat) && (
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-400">P: {typeof displayProtein === 'number' ? displayProtein.toFixed(1) : '0'}g</span>
                          <span className="text-blue-400">C: {typeof displayCarbs === 'number' ? displayCarbs.toFixed(1) : '0'}g</span>
                          <span className="text-yellow-400">G: {typeof displayFat === 'number' ? displayFat.toFixed(1) : '0'}g</span>
                        </div>
                      )}

                      {/* Instructions */}
                      {meal.instructions && (
                        <p className="text-xs text-slate-400 italic">{meal.instructions}</p>
                      )}

                      {/* Alternatives with Option Buttons */}
                      {hasAlternatives && (
                        <div className="space-y-3">
                          {/* Quick Option Selector */}
                          {!isCompleted && (
                            <div>
                              <p className="text-xs text-slate-400 mb-2">Escolha uma opção:</p>
                              <div className="flex gap-2 flex-wrap">
                                {/* Option A (primary) */}
                                <button
                                  onClick={() => onCompleteMeal(meal)}
                                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                >
                                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">A</span>
                                  <span className="text-sm font-medium truncate max-w-[120px]">{meal.meal_name || 'Principal'}</span>
                                </button>
                                {/* Other options */}
                                {meal.alternatives!.map((alt, altIdx) => {
                                  const isNamedAlt = 'option' in alt && 'name' in alt
                                  const optionLetter = isNamedAlt ? (alt as MealAlternative).option : String.fromCharCode(66 + altIdx) // B, C, D, E...
                                  const optionName = isNamedAlt ? (alt as MealAlternative).name : `Opção ${optionLetter}`
                                  return (
                                    <button
                                      key={altIdx}
                                      onClick={() => onCompleteMeal(meal, altIdx)}
                                      className="flex items-center gap-2 px-3 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                                    >
                                      <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold flex items-center justify-center">{optionLetter}</span>
                                      <span className="text-sm font-medium truncate max-w-[120px]">{optionName}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Expandable Details */}
                          <button
                            onClick={() => setShowAlternatives(showAlternatives === meal.id ? null : meal.id)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            {showAlternatives === meal.id ? 'Esconder' : 'Ver'} detalhes das opções
                          </button>

                          <AnimatePresence>
                            {showAlternatives === meal.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2"
                              >
                                {/* Option A Details */}
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">A</span>
                                    <span className="text-sm font-medium text-green-400">{meal.meal_name || 'Principal'}</span>
                                  </div>
                                  <div className="space-y-1">
                                    {meal.foods?.map((food, foodIdx) => (
                                      <div key={foodIdx} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300">{food.name}</span>
                                        <span className="text-slate-400">{food.quantity}{food.unit}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Other Options Details */}
                                {meal.alternatives!.map((alt, altIdx) => {
                                  const isNamedAlt = 'option' in alt && 'name' in alt
                                  const optionLetter = isNamedAlt ? (alt as MealAlternative).option : String.fromCharCode(66 + altIdx)
                                  const optionName = isNamedAlt ? (alt as MealAlternative).name : `Opção ${optionLetter}`
                                  const foods = isNamedAlt ? (alt as MealAlternative).foods : (alt as Food[])

                                  return (
                                    <div key={altIdx} className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">{optionLetter}</span>
                                        <span className="text-sm font-medium text-violet-400">{optionName}</span>
                                      </div>
                                      <div className="space-y-1">
                                        {foods.map((food, foodIdx) => (
                                          <div key={foodIdx} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-300">{food.name}</span>
                                            <span className="text-slate-400">{food.quantity}{food.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Action Buttons - show only when no alternatives */}
                      {!isCompleted && !hasAlternatives && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => onCompleteMeal(meal)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Marcar como feita
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/analisar?planMealId=${meal.id}&tipo=${meal.meal_type}`)}
                            className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                            title="Analisar foto com IA"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/nova?tipo=${meal.meal_type}&planMealId=${meal.id}`)}
                            className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Adicionar manualmente"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Edit button when there are alternatives */}
                      {!isCompleted && hasAlternatives && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/alimentacao/analisar?planMealId=${meal.id}&tipo=${meal.meal_type}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-violet-400 hover:text-white border border-dashed border-violet-500/50 rounded-lg hover:border-violet-500 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            Analisar foto
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/nova?tipo=${meal.meal_type}&planMealId=${meal.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white border border-dashed border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar manual
                          </button>
                        </div>
                      )}

                      {/* Action buttons for completed meals */}
                      {isCompleted && actualMealData && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/${actualMealData.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/analisar?mealId=${actualMealData.id}&tipo=${meal.meal_type}`)}
                            className="px-3 py-2 text-sm bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                            title="Adicionar foto com IA"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/${actualMealData.id}`)}
                            className="px-3 py-2 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            title="Adicionar mais alimentos"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Add Different Meal */}
      <div className="p-4 border-t border-green-500/20">
        <button
          onClick={onAddDifferentMeal}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white border border-dashed border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar refeição diferente
        </button>
      </div>
    </motion.div>
  )
}

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
  User
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
  alternatives?: Food[][]
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
                  {meal.total_calories && (
                    <span className="text-sm text-orange-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {meal.total_calories} kcal
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
                      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-slate-400 uppercase">Alimentos</p>
                        {meal.foods?.map((food, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{food.name}</span>
                            <span className="text-slate-400">
                              {food.quantity}{food.unit} • {food.calories || 0} kcal
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Macros */}
                      {(meal.total_protein || meal.total_carbs || meal.total_fat) && (
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-400">P: {meal.total_protein?.toFixed(1) || 0}g</span>
                          <span className="text-blue-400">C: {meal.total_carbs?.toFixed(1) || 0}g</span>
                          <span className="text-yellow-400">G: {meal.total_fat?.toFixed(1) || 0}g</span>
                        </div>
                      )}

                      {/* Instructions */}
                      {meal.instructions && (
                        <p className="text-xs text-slate-400 italic">{meal.instructions}</p>
                      )}

                      {/* Alternatives */}
                      {hasAlternatives && (
                        <div>
                          <button
                            onClick={() => setShowAlternatives(showAlternatives === meal.id ? null : meal.id)}
                            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            Ver {meal.alternatives!.length} {meal.alternatives!.length === 1 ? 'variação' : 'variações'}
                          </button>

                          <AnimatePresence>
                            {showAlternatives === meal.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 space-y-2"
                              >
                                {meal.alternatives!.map((altFoods, altIdx) => (
                                  <div key={altIdx} className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-violet-400">
                                        Opção {altIdx + 1}
                                      </span>
                                      {!isCompleted && (
                                        <button
                                          onClick={() => onCompleteMeal(meal, altIdx)}
                                          className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30"
                                        >
                                          Usar esta
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      {altFoods.map((food, foodIdx) => (
                                        <div key={foodIdx} className="flex items-center justify-between text-xs">
                                          <span className="text-slate-300">{food.name}</span>
                                          <span className="text-slate-400">
                                            {food.quantity}{food.unit}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!isCompleted && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => onCompleteMeal(meal)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Marcar como feita
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/nova?tipo=${meal.meal_type}&planMealId=${meal.id}`)}
                            className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Editar e salvar"
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

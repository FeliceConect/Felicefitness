"use client"

import { useState, useEffect } from 'react'
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
import { groupPlanFoods, formatFoodAmount } from '@/lib/nutrition/meal-foods'

interface Food {
  name: string
  quantity: number
  unit: string
  portion_label?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  group?: string | null
  choice?: boolean
}

// Lista de alimentos do plano, deixando claro o que é FIXO (sempre comer, com ✓)
// e o que é ESCOLHA ("escolher 1"). Quando `selectable`, o paciente toca a
// opção que comeu (seleção única por grupo) para registrar o que realmente comeu.
function FoodGroupList({
  foods,
  compact = false,
  selectable = false,
  selectedNames,
  onSelect,
}: {
  foods: Food[]
  compact?: boolean
  selectable?: boolean
  selectedNames?: Record<string, string>
  onSelect?: (group: string, name: string) => void
}) {
  const blocks = groupPlanFoods(foods)
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        // Alimento fixo — sempre incluir
        if (!block.group) {
          const f = block.items[0]
          return (
            <div key={bi} className="flex items-center justify-between gap-2 text-sm px-0.5">
              <span className="flex items-center gap-2 text-foreground min-w-0">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <span className="text-foreground-secondary whitespace-nowrap text-xs">
                {formatFoodAmount(f)}{!compact && f.calories ? ` • ${f.calories} kcal` : ''}
              </span>
            </div>
          )
        }
        // Grupo de escolha — escolher 1
        const group = block.group
        const selName = selectedNames?.[group] ?? block.items[0]?.name
        return (
          <div key={bi} className="rounded-lg border border-dourado/30 bg-dourado/5 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dourado/15">
              <ArrowRightLeft className="w-3 h-3 text-dourado flex-shrink-0" />
              <span className="text-[11px] font-bold text-dourado uppercase tracking-wide">
                {selectable ? 'Toque no que comeu' : 'Escolha 1'} · {group}
              </span>
            </div>
            <div className="divide-y divide-dourado/10">
              {block.items.map((f, fi) => {
                const isSel = selectable && f.name === selName
                const dot = isSel ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-dourado flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-dourado/40 flex-shrink-0" />
                )
                const content = (
                  <>
                    <span className="flex items-center gap-2 text-foreground min-w-0">
                      {dot}
                      <span className={`truncate ${isSel ? 'font-semibold' : ''}`}>{f.name}</span>
                    </span>
                    <span className="text-foreground-secondary whitespace-nowrap text-xs">{formatFoodAmount(f)}</span>
                  </>
                )
                return selectable ? (
                  <button
                    key={fi}
                    type="button"
                    onClick={() => onSelect?.(group, f.name)}
                    className={`w-full flex items-center justify-between gap-2 text-sm px-3 py-2 text-left transition-colors ${isSel ? 'bg-dourado/15' : 'hover:bg-dourado/5'}`}
                  >
                    {content}
                  </button>
                ) : (
                  <div key={fi} className="flex items-center justify-between gap-2 text-sm px-3 py-1.5">
                    {content}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
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
  onCompleteMeal: (meal: PlannedMeal, chosenFoods?: Food[]) => void
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
  // Seleção do paciente por grupo "escolher 1": mealId -> { grupo -> nome do alimento }
  const [selections, setSelections] = useState<Record<string, Record<string, string>>>({})
  const router = useRouter()

  // Inicializa as seleções (lembra a última escolha via localStorage; senão, a 1ª opção)
  const mealsKey = todayMeals.map(m => m.id).join(',')
  useEffect(() => {
    const init: Record<string, Record<string, string>> = {}
    for (const meal of todayMeals) {
      for (const block of groupPlanFoods(meal.foods)) {
        if (!block.group) continue
        let chosen = block.items[0]?.name
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem(`mealSel:${plan.id}:${meal.meal_type}:${block.group}`)
          if (stored && block.items.some(i => i.name === stored)) chosen = stored
        }
        if (chosen) {
          init[meal.id] = init[meal.id] || {}
          init[meal.id][block.group] = chosen
        }
      }
    }
    setSelections(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id, mealsKey])

  function selectFood(meal: PlannedMeal, group: string, name: string) {
    setSelections(prev => ({ ...prev, [meal.id]: { ...(prev[meal.id] || {}), [group]: name } }))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`mealSel:${plan.id}:${meal.meal_type}:${group}`, name)
    }
  }

  // Monta os alimentos realmente consumidos: fixos + a opção selecionada de cada grupo
  function buildChosenFoods(meal: PlannedMeal): Food[] {
    const out: Food[] = []
    for (const block of groupPlanFoods(meal.foods)) {
      if (!block.group) { if (block.items[0]) out.push(block.items[0] as Food); continue }
      const selName = selections[meal.id]?.[block.group] ?? block.items[0]?.name
      const chosen = block.items.find(i => i.name === selName) || block.items[0]
      if (chosen) out.push(chosen as Food)
    }
    return out
  }

  // Para opções de refeição (A/B/C): pega 1 por grupo (default 1ª) + fixos
  function resolveFoods(foods: Food[]): Food[] {
    return groupPlanFoods(foods).map(b => b.items[0] as Food).filter(Boolean)
  }

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
              <h3 className="font-semibold text-foreground">{plan.name}</h3>
              {plan.professional && (
                <p className="text-xs text-foreground-secondary flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {plan.professional.display_name || 'Nutricionista'}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">{completedCount}/{totalCount}</p>
            <p className="text-xs text-foreground-secondary">refeições</p>
          </div>
        </div>

        {/* Training Day Indicator */}
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
          isTrainingDay
            ? 'bg-dourado/10 border border-dourado/20'
            : 'bg-white/50 border border-border/50'
        }`}>
          <span className="text-lg">{isTrainingDay ? '💪' : '😴'}</span>
          <span className={`text-sm font-medium ${isTrainingDay ? 'text-dourado' : 'text-foreground-secondary'}`}>
            {isTrainingDay ? 'Dia de Treino' : 'Dia de Descanso'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white rounded-full overflow-hidden">
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
                      <span className={`font-medium ${isCompleted ? 'text-green-400 line-through' : 'text-foreground'}`}>
                        {meal.meal_name || MEAL_TYPE_LABELS[meal.meal_type]}
                      </span>
                      {isCompleted && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                          Feita
                        </span>
                      )}
                    </div>
                    {meal.scheduled_time && (
                      <p className="text-xs text-foreground-secondary flex items-center gap-1">
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
                    <ChevronUp className="w-5 h-5 text-foreground-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground-secondary" />
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
                        isCustomMeal ? 'bg-dourado/10 border border-dourado/20' : 'bg-white/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-foreground-secondary uppercase">Alimentos</p>
                          {isCustomMeal && (
                            <span className="text-xs text-dourado px-2 py-0.5 bg-dourado/20 rounded">
                              Personalizada
                            </span>
                          )}
                        </div>
                        {!isCompleted && (displayFoods || []).some(f => f.group) && (
                          <p className="text-[11px] text-foreground-muted">
                            ✓ sempre incluir · toque pra marcar o que comeu em cada grupo
                          </p>
                        )}
                        <FoodGroupList
                          foods={displayFoods || []}
                          selectable={!isCompleted && !isCustomMeal}
                          selectedNames={selections[meal.id]}
                          onSelect={(group, name) => selectFood(meal, group, name)}
                        />
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
                        <p className="text-xs text-foreground-secondary italic">{meal.instructions}</p>
                      )}

                      {/* Alternatives with Option Buttons */}
                      {hasAlternatives && (
                        <div className="space-y-3">
                          {/* Quick Option Selector */}
                          {!isCompleted && (
                            <div>
                              <p className="text-xs text-foreground-secondary mb-2">Escolha uma opção:</p>
                              <div className="flex gap-2 flex-wrap">
                                {/* Option A (primary) */}
                                <button
                                  onClick={() => onCompleteMeal(meal, buildChosenFoods(meal))}
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
                                  const altFoods = isNamedAlt ? (alt as MealAlternative).foods : (alt as Food[])
                                  return (
                                    <button
                                      key={altIdx}
                                      onClick={() => onCompleteMeal(meal, resolveFoods(altFoods))}
                                      className="flex items-center gap-2 px-3 py-2 bg-dourado/20 border border-dourado/30 text-dourado rounded-lg hover:bg-dourado/30 transition-colors"
                                    >
                                      <span className="w-6 h-6 rounded-full bg-vinho text-white text-sm font-bold flex items-center justify-center">{optionLetter}</span>
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
                            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
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
                                  <FoodGroupList foods={meal.foods || []} compact />
                                </div>

                                {/* Other Options Details */}
                                {meal.alternatives!.map((alt, altIdx) => {
                                  const isNamedAlt = 'option' in alt && 'name' in alt
                                  const optionLetter = isNamedAlt ? (alt as MealAlternative).option : String.fromCharCode(66 + altIdx)
                                  const optionName = isNamedAlt ? (alt as MealAlternative).name : `Opção ${optionLetter}`
                                  const foods = isNamedAlt ? (alt as MealAlternative).foods : (alt as Food[])

                                  return (
                                    <div key={altIdx} className="bg-dourado/10 border border-dourado/20 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="w-5 h-5 rounded-full bg-vinho text-white text-xs font-bold flex items-center justify-center">{optionLetter}</span>
                                        <span className="text-sm font-medium text-dourado">{optionName}</span>
                                      </div>
                                      <FoodGroupList foods={foods} compact />
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
                            onClick={() => onCompleteMeal(meal, buildChosenFoods(meal))}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Comi
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/analisar?planMealId=${meal.id}&tipo=${meal.meal_type}`)}
                            className="px-3 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/80 transition-colors"
                            title="Analisar foto com IA"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/nova?tipo=${meal.meal_type}&planMealId=${meal.id}`)}
                            className="px-3 py-2 bg-background-elevated text-foreground-secondary rounded-lg hover:bg-background-elevated transition-colors"
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
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-dourado hover:text-foreground border border-dashed border-dourado/50 rounded-lg hover:border-dourado transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            Analisar foto
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/refeicao/nova?tipo=${meal.meal_type}&planMealId=${meal.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-foreground-secondary hover:text-foreground border border-dashed border-border rounded-lg hover:border-foreground-muted transition-colors"
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
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-background-elevated text-foreground-secondary rounded-lg hover:bg-background-elevated transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => router.push(`/alimentacao/analisar?mealId=${actualMealData.id}&tipo=${meal.meal_type}`)}
                            className="px-3 py-2 text-sm bg-dourado/20 text-dourado rounded-lg hover:bg-dourado/30 transition-colors"
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
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-foreground-secondary hover:text-foreground border border-dashed border-border rounded-lg hover:border-foreground-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar refeição diferente
        </button>
      </div>
    </motion.div>
  )
}

"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Users,
  Calendar,
  Target,
  ArrowRightLeft
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface Food {
  name: string
  quantity: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

// Formato novo para alternativas importadas por IA
interface MealAlternative {
  option: string  // "B", "C", "D", etc
  name: string    // Nome da opção
  foods: Food[]
}

interface Meal {
  id?: string
  meal_type: string
  meal_name?: string
  scheduled_time?: string
  foods: Food[]
  total_calories?: number
  total_protein?: number
  total_carbs?: number
  total_fat?: number
  instructions?: string
  alternatives?: MealAlternative[] | Food[][] // Suporta ambos formatos
  order_index: number
}

interface Day {
  id?: string
  day_of_week: number
  day_name?: string
  calories_target?: number
  notes?: string
  meals: Meal[]
}

interface MealPlan {
  id: string
  name: string
  description?: string
  goal?: string
  calories_target?: number
  protein_target?: number
  carbs_target?: number
  fat_target?: number
  fiber_target?: number
  water_target?: number
  duration_weeks: number
  is_template: boolean
  is_active: boolean
  client_id?: string
  client?: { id: string; nome: string; email: string }
  days: Day[]
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Café da Manhã', time: '07:00' },
  { value: 'morning_snack', label: 'Lanche da Manhã', time: '10:00' },
  { value: 'lunch', label: 'Almoço', time: '12:30' },
  { value: 'afternoon_snack', label: 'Lanche da Tarde', time: '16:00' },
  { value: 'dinner', label: 'Jantar', time: '19:30' },
  { value: 'supper', label: 'Ceia', time: '22:00' }
]

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Emagrecimento',
  muscle_gain: 'Ganho de Massa',
  maintenance: 'Manutenção',
  health: 'Saúde',
  custom: 'Personalizado'
}

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

export default function MealPlanDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isNutritionist, loading: professionalLoading } = useProfessional()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedDays, setExpandedDays] = useState<number[]>([])
  const [showAddMealModal, setShowAddMealModal] = useState<{ dayIndex: number } | null>(null)
  const [showAddFoodModal, setShowAddFoodModal] = useState<{ dayIndex: number; mealIndex: number } | null>(null)
  const [showAlternativesModal, setShowAlternativesModal] = useState<{ dayIndex: number; mealIndex: number } | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!professionalLoading && !isNutritionist) {
      router.push('/portal')
    }
  }, [isNutritionist, professionalLoading, router])

  useEffect(() => {
    fetchPlan()
    fetchClients()
  }, [id])

  async function fetchClients() {
    try {
      const response = await fetch('/api/professional/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  async function assignClient(clientId: string | null) {
    if (!plan) return

    try {
      const response = await fetch('/api/portal/meal-plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          clientId: clientId
        })
      })

      const data = await response.json()

      if (data.success) {
        const updatedPlan = data.plan
        setPlan({
          ...plan,
          client_id: updatedPlan.client_id || undefined,
          client: updatedPlan.client || undefined
        })
        setShowClientModal(false)
        alert('Cliente atualizado com sucesso!')
      } else {
        alert('Erro ao atribuir cliente: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atribuir cliente:', error)
      alert('Erro ao atribuir cliente')
    }
  }

  async function fetchPlan() {
    try {
      const response = await fetch(`/api/portal/meal-plans/${id}`)
      const data = await response.json()
      if (data.success) {
        // Initialize days if empty
        const planData = data.plan
        if (!planData.days || planData.days.length === 0) {
          planData.days = Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            day_name: DAY_NAMES[i],
            meals: []
          }))
        }
        setPlan(planData)
        // Expand first day by default
        setExpandedDays([0])
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!plan) return

    setSaving(true)
    try {
      const response = await fetch(`/api/portal/meal-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          goal: plan.goal,
          caloriesTarget: plan.calories_target,
          proteinTarget: plan.protein_target,
          carbsTarget: plan.carbs_target,
          fatTarget: plan.fat_target,
          fiberTarget: plan.fiber_target,
          waterTarget: plan.water_target,
          durationWeeks: plan.duration_weeks,
          days: plan.days.map(day => ({
            dayOfWeek: day.day_of_week,
            dayName: day.day_name,
            caloriesTarget: day.calories_target,
            notes: day.notes,
            meals: day.meals.map((meal, idx) => ({
              mealType: meal.meal_type,
              mealName: meal.meal_name,
              scheduledTime: meal.scheduled_time,
              foods: meal.foods,
              totalCalories: meal.total_calories,
              totalProtein: meal.total_protein,
              totalCarbs: meal.total_carbs,
              totalFat: meal.total_fat,
              instructions: meal.instructions,
              alternatives: meal.alternatives || [],
              orderIndex: idx
            }))
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        setHasChanges(false)
        router.push('/portal/nutrition')
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
    } finally {
      setSaving(false)
    }
  }

  function toggleDay(dayIndex: number) {
    setExpandedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    )
  }

  function addMeal(dayIndex: number, mealType: string) {
    if (!plan) return

    const mealInfo = MEAL_TYPES.find(m => m.value === mealType)
    const newMeal: Meal = {
      meal_type: mealType,
      meal_name: mealInfo?.label,
      scheduled_time: mealInfo?.time,
      foods: [],
      order_index: plan.days[dayIndex].meals.length
    }

    const newDays = [...plan.days]
    newDays[dayIndex].meals.push(newMeal)
    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
    setShowAddMealModal(null)
  }

  function removeMeal(dayIndex: number, mealIndex: number) {
    if (!plan) return

    const newDays = [...plan.days]
    newDays[dayIndex].meals.splice(mealIndex, 1)
    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
  }

  function addFood(dayIndex: number, mealIndex: number, food: Food) {
    if (!plan) return

    const newDays = [...plan.days]
    newDays[dayIndex].meals[mealIndex].foods.push(food)

    // Recalculate totals
    const meal = newDays[dayIndex].meals[mealIndex]
    meal.total_calories = meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
    meal.total_protein = meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0)
    meal.total_carbs = meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0)
    meal.total_fat = meal.foods.reduce((sum, f) => sum + (f.fat || 0), 0)

    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
    setShowAddFoodModal(null)
  }

  function removeFood(dayIndex: number, mealIndex: number, foodIndex: number) {
    if (!plan) return

    const newDays = [...plan.days]
    newDays[dayIndex].meals[mealIndex].foods.splice(foodIndex, 1)

    // Recalculate totals
    const meal = newDays[dayIndex].meals[mealIndex]
    meal.total_calories = meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
    meal.total_protein = meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0)
    meal.total_carbs = meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0)
    meal.total_fat = meal.foods.reduce((sum, f) => sum + (f.fat || 0), 0)

    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
  }

  function copyDayToAll(fromDayIndex: number) {
    if (!plan) return

    const sourceMeals = plan.days[fromDayIndex].meals
    const newDays = plan.days.map((day, idx) => {
      if (idx === fromDayIndex) return day
      return {
        ...day,
        meals: JSON.parse(JSON.stringify(sourceMeals))
      }
    })

    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
  }

  function addAlternative(dayIndex: number, mealIndex: number, foods: Food[]) {
    if (!plan) return

    const newDays = [...plan.days]
    const meal = newDays[dayIndex].meals[mealIndex]

    if (!meal.alternatives) {
      meal.alternatives = [] as Food[][]
    }

    (meal.alternatives as Food[][]).push(foods)
    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
  }

  function removeAlternative(dayIndex: number, mealIndex: number, altIndex: number) {
    if (!plan) return

    const newDays = [...plan.days]
    const meal = newDays[dayIndex].meals[mealIndex]

    if (meal.alternatives) {
      meal.alternatives.splice(altIndex, 1)
    }

    setPlan({ ...plan, days: newDays })
    setHasChanges(true)
  }

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-secondary">Plano não encontrado</p>
        <Link href="/portal/nutrition" className="text-dourado hover:text-dourado/80 mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/nutrition"
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            <div className="flex items-center gap-3 text-sm text-foreground-secondary">
              {plan.is_template && (
                <span className="px-2 py-0.5 bg-dourado/20 text-dourado rounded-full text-xs">
                  Template
                </span>
              )}
              {plan.goal && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {GOAL_LABELS[plan.goal]}
                </span>
              )}
              {plan.client && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {plan.client.nome}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={savePlan}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Macros Summary */}
      {(plan.calories_target || plan.protein_target || plan.carbs_target || plan.fat_target) && (
        <div className="bg-white rounded-xl p-4 border border-border">
          <h3 className="text-sm font-medium text-foreground-secondary mb-3">Metas Diárias</h3>
          <div className="flex flex-wrap gap-4">
            {plan.calories_target && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-foreground font-medium">{plan.calories_target}</span>
                <span className="text-foreground-muted text-sm">kcal</span>
              </div>
            )}
            {plan.protein_target && (
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">P:</span>
                <span className="text-foreground">{plan.protein_target}g</span>
              </div>
            )}
            {plan.carbs_target && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">C:</span>
                <span className="text-foreground">{plan.carbs_target}g</span>
              </div>
            )}
            {plan.fat_target && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-600 font-medium">G:</span>
                <span className="text-foreground">{plan.fat_target}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client Assignment */}
      {!plan.is_template && (
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground-secondary">Cliente Atribuído</h3>
                {plan.client ? (
                  <p className="text-foreground font-medium">{plan.client.nome}</p>
                ) : (
                  <p className="text-orange-500">Nenhum cliente atribuído</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowClientModal(true)}
              className="px-3 py-1.5 bg-background-elevated text-foreground-secondary rounded-lg hover:bg-border transition-colors text-sm border border-border"
            >
              {plan.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
            </button>
          </div>
        </div>
      )}

      {/* Days */}
      <div className="space-y-4">
        {plan.days.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Day Header */}
            <div
              onClick={() => toggleDay(dayIndex)}
              className="w-full flex items-center justify-between p-4 hover:bg-background-elevated transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dourado/15 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-dourado" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{DAY_NAMES[day.day_of_week]}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {day.meals.length} {day.meals.length === 1 ? 'refeição' : 'refeições'}
                    {day.meals.length > 0 && ` - ${day.meals.reduce((sum, m) => sum + (m.total_calories || 0), 0)} kcal`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {day.meals.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyDayToAll(dayIndex)
                    }}
                    className="px-2 py-1 text-xs bg-background-elevated text-foreground-secondary rounded hover:bg-border border border-border"
                  >
                    Copiar para todos
                  </button>
                )}
                {expandedDays.includes(dayIndex) ? (
                  <ChevronUp className="w-5 h-5 text-foreground-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-foreground-muted" />
                )}
              </div>
            </div>

            {/* Day Content */}
            {expandedDays.includes(dayIndex) && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Meals */}
                {day.meals.length === 0 ? (
                  <p className="text-center text-foreground-secondary py-4">
                    Nenhuma refeição adicionada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="bg-background-elevated rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium">
                              {meal.meal_name || MEAL_TYPES.find(m => m.value === meal.meal_type)?.label}
                            </span>
                            {meal.scheduled_time && (
                              <span className="text-sm text-foreground-muted flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meal.scheduled_time}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-orange-600 font-medium">
                              {meal.total_calories || 0} kcal
                            </span>
                            <button
                              onClick={() => removeMeal(dayIndex, mealIndex)}
                              className="p-1 hover:bg-red-500/10 rounded text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Foods */}
                        {meal.foods.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {meal.foods.map((food, foodIndex) => (
                              <div
                                key={foodIndex}
                                className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border border-border"
                              >
                                <span className="text-foreground">
                                  {food.name} - {food.quantity}{food.unit}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-foreground-muted">{food.calories || 0} kcal</span>
                                  <button
                                    onClick={() => removeFood(dayIndex, mealIndex, foodIndex)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Macros summary */}
                        {meal.foods.length > 0 && (
                          <div className="flex gap-3 text-xs text-foreground-muted mb-3">
                            <span>P: {meal.total_protein?.toFixed(1) || 0}g</span>
                            <span>C: {meal.total_carbs?.toFixed(1) || 0}g</span>
                            <span>G: {meal.total_fat?.toFixed(1) || 0}g</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowAddFoodModal({ dayIndex, mealIndex })}
                            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar alimento
                          </button>
                          {meal.foods.length > 0 && (
                            <button
                              onClick={() => setShowAlternativesModal({ dayIndex, mealIndex })}
                              className="flex items-center gap-1 text-sm text-dourado hover:text-dourado/80"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                              Variações ({meal.alternatives?.length || 0})
                            </button>
                          )}
                        </div>

                        {/* Alternatives/Variations */}
                        {meal.alternatives && meal.alternatives.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-dourado mb-2">
                              Variações disponíveis para o cliente:
                            </p>
                            <div className="space-y-2">
                              {meal.alternatives.map((altItem, altIndex) => {
                                const isNewFormat = 'option' in altItem && 'foods' in altItem
                                const altFoods = isNewFormat
                                  ? (altItem as MealAlternative).foods
                                  : (altItem as Food[])
                                const optionLabel = isNewFormat
                                  ? `Opção ${(altItem as MealAlternative).option}: ${(altItem as MealAlternative).name}`
                                  : `Opção ${altIndex + 2}`

                                return (
                                  <div
                                    key={altIndex}
                                    className="flex items-center justify-between bg-dourado/10 rounded px-3 py-2 text-sm"
                                  >
                                    <div className="flex-1">
                                      <span className="text-dourado font-medium">{optionLabel}</span>
                                      <span className="text-foreground-secondary ml-2">
                                        {altFoods.map(f => f.name).join(', ')}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeAlternative(dayIndex, mealIndex, altIndex)}
                                      className="text-red-500 hover:text-red-600 ml-2"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Meal Button */}
                <button
                  onClick={() => setShowAddMealModal({ dayIndex })}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-foreground-muted hover:border-dourado hover:text-dourado transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Refeição
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Adicionar Refeição</h3>
            <div className="grid grid-cols-2 gap-3">
              {MEAL_TYPES.map((mealType) => (
                <button
                  key={mealType.value}
                  onClick={() => addMeal(showAddMealModal.dayIndex, mealType.value)}
                  className="p-4 bg-background-elevated rounded-lg hover:bg-border transition-colors text-left border border-border"
                >
                  <p className="text-foreground font-medium">{mealType.label}</p>
                  <p className="text-sm text-foreground-muted">{mealType.time}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddMealModal(null)}
              className="w-full mt-4 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border border border-border"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddFoodModal && (
        <AddFoodModal
          onClose={() => setShowAddFoodModal(null)}
          onAdd={(food) => addFood(showAddFoodModal.dayIndex, showAddFoodModal.mealIndex, food)}
        />
      )}

      {/* Alternatives Modal */}
      {showAlternativesModal && plan && (
        <AlternativesModal
          meal={plan.days[showAlternativesModal.dayIndex].meals[showAlternativesModal.mealIndex]}
          onClose={() => setShowAlternativesModal(null)}
          onAddAlternative={(foods) => {
            addAlternative(showAlternativesModal.dayIndex, showAlternativesModal.mealIndex, foods)
            setShowAlternativesModal(null)
          }}
        />
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 my-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {plan.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="p-1 hover:bg-background-elevated rounded">
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {/* Opção para remover atribuição */}
              {plan.client && (
                <button
                  onClick={() => assignClient(null)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-red-500 font-medium">Remover atribuição</p>
                    <p className="text-xs text-foreground-muted">Este plano ficará sem cliente</p>
                  </div>
                </button>
              )}

              {/* Lista de clientes */}
              {clients.length === 0 ? (
                <p className="text-center text-foreground-secondary py-4">
                  Nenhum cliente encontrado
                </p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => assignClient(client.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      plan.client_id === client.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-border hover:border-dourado/50 hover:bg-background-elevated'
                    }`}
                  >
                    {client.avatar_url ? (
                      <img
                        src={client.avatar_url}
                        alt={client.nome}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-background-elevated flex items-center justify-center">
                        <span className="text-foreground-secondary font-medium">
                          {client.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-foreground font-medium">{client.nome}</p>
                      <p className="text-xs text-foreground-muted">{client.email}</p>
                    </div>
                    {plan.client_id === client.id && (
                      <Check className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setShowClientModal(false)}
                className="w-full px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add Food Modal Component
function AddFoodModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (food: Food) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.quantity) return

    onAdd({
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      calories: formData.calories ? parseFloat(formData.calories) : 0,
      protein: formData.protein ? parseFloat(formData.protein) : 0,
      carbs: formData.carbs ? parseFloat(formData.carbs) : 0,
      fat: formData.fat ? parseFloat(formData.fat) : 0
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Adicionar Alimento</h3>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nome do Alimento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Arroz integral"
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Unidade
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
              >
                <option value="g">gramas (g)</option>
                <option value="ml">mililitros (ml)</option>
                <option value="un">unidade (un)</option>
                <option value="col">colher (col)</option>
                <option value="xic">xícara (xíc)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Calorias</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Proteína</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Carbos</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Gordura</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Alternatives Modal Component
function AlternativesModal({
  meal,
  onClose,
  onAddAlternative
}: {
  meal: Meal
  onClose: () => void
  onAddAlternative: (foods: Food[]) => void
}) {
  const [foods, setFoods] = useState<Food[]>([])
  const [currentFood, setCurrentFood] = useState({
    name: '',
    quantity: '',
    unit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  function addFoodToList() {
    if (!currentFood.name || !currentFood.quantity) return

    setFoods([
      ...foods,
      {
        name: currentFood.name,
        quantity: parseFloat(currentFood.quantity),
        unit: currentFood.unit,
        calories: currentFood.calories ? parseFloat(currentFood.calories) : 0,
        protein: currentFood.protein ? parseFloat(currentFood.protein) : 0,
        carbs: currentFood.carbs ? parseFloat(currentFood.carbs) : 0,
        fat: currentFood.fat ? parseFloat(currentFood.fat) : 0
      }
    ])

    setCurrentFood({
      name: '',
      quantity: '',
      unit: 'g',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
  }

  function removeFoodFromList(index: number) {
    setFoods(foods.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (foods.length === 0) return
    onAddAlternative(foods)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Adicionar Variação</h3>
            <p className="text-sm text-foreground-secondary">
              Crie uma opção alternativa para: {meal.meal_name || meal.meal_type}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Original Foods Reference */}
          <div className="p-3 bg-background-elevated rounded-lg">
            <p className="text-xs font-medium text-foreground-muted uppercase mb-2">Alimentos originais (referência)</p>
            <div className="flex flex-wrap gap-2">
              {meal.foods.map((food, idx) => (
                <span key={idx} className="px-2 py-1 bg-white text-foreground-secondary text-xs rounded border border-border">
                  {food.name} - {food.quantity}{food.unit}
                </span>
              ))}
            </div>
          </div>

          {/* Foods in this alternative */}
          {foods.length > 0 && (
            <div className="p-3 bg-dourado/10 border border-dourado/20 rounded-lg">
              <p className="text-xs font-medium text-dourado uppercase mb-2">Alimentos desta variação</p>
              <div className="space-y-2">
                {foods.map((food, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{food.name} - {food.quantity}{food.unit}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground-muted">{food.calories} kcal</span>
                      <button
                        onClick={() => removeFoodFromList(idx)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add food form */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={currentFood.name}
                onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
                placeholder="Nome do alimento"
                className="px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={currentFood.quantity}
                  onChange={(e) => setCurrentFood({ ...currentFood, quantity: e.target.value })}
                  placeholder="Qtd"
                  className="flex-1 px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
                />
                <select
                  value={currentFood.unit}
                  onChange={(e) => setCurrentFood({ ...currentFood, unit: e.target.value })}
                  className="w-20 px-2 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="un">un</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                value={currentFood.calories}
                onChange={(e) => setCurrentFood({ ...currentFood, calories: e.target.value })}
                placeholder="kcal"
                className="px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
              <input
                type="number"
                value={currentFood.protein}
                onChange={(e) => setCurrentFood({ ...currentFood, protein: e.target.value })}
                placeholder="Prot"
                className="px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
              <input
                type="number"
                value={currentFood.carbs}
                onChange={(e) => setCurrentFood({ ...currentFood, carbs: e.target.value })}
                placeholder="Carb"
                className="px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
              <input
                type="number"
                value={currentFood.fat}
                onChange={(e) => setCurrentFood({ ...currentFood, fat: e.target.value })}
                placeholder="Gord"
                className="px-2 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
              />
            </div>
            <button
              onClick={addFoodToList}
              disabled={!currentFood.name || !currentFood.quantity}
              className="w-full py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-border"
            >
              <Plus className="w-4 h-4" />
              Adicionar alimento à variação
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={foods.length === 0}
            className="flex-1 px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Salvar Variação
          </button>
        </div>
      </div>
    </div>
  )
}

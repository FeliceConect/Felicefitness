"use client"

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Target
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

export default function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isNutritionist, loading: professionalLoading } = useProfessional()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedDays, setExpandedDays] = useState<number[]>([])
  const [showAddMealModal, setShowAddMealModal] = useState<{ dayIndex: number } | null>(null)
  const [showAddFoodModal, setShowAddFoodModal] = useState<{ dayIndex: number; mealIndex: number } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!professionalLoading && !isNutritionist) {
      router.push('/portal')
    }
  }, [isNutritionist, professionalLoading, router])

  useEffect(() => {
    fetchPlan()
  }, [id])

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
              orderIndex: idx
            }))
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        setHasChanges(false)
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

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Plano não encontrado</p>
        <Link href="/portal/nutrition" className="text-violet-400 hover:text-violet-300 mt-4 inline-block">
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
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              {plan.is_template && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">
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
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Metas Diárias</h3>
          <div className="flex flex-wrap gap-4">
            {plan.calories_target && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white font-medium">{plan.calories_target}</span>
                <span className="text-slate-400 text-sm">kcal</span>
              </div>
            )}
            {plan.protein_target && (
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-medium">P:</span>
                <span className="text-white">{plan.protein_target}g</span>
              </div>
            )}
            {plan.carbs_target && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-medium">C:</span>
                <span className="text-white">{plan.carbs_target}g</span>
              </div>
            )}
            {plan.fat_target && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-medium">G:</span>
                <span className="text-white">{plan.fat_target}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Days */}
      <div className="space-y-4">
        {plan.days.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Day Header */}
            <button
              onClick={() => toggleDay(dayIndex)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">{DAY_NAMES[day.day_of_week]}</h3>
                  <p className="text-sm text-slate-400">
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
                    className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                  >
                    Copiar para todos
                  </button>
                )}
                {expandedDays.includes(dayIndex) ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Day Content */}
            {expandedDays.includes(dayIndex) && (
              <div className="border-t border-slate-700 p-4 space-y-4">
                {/* Meals */}
                {day.meals.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">
                    Nenhuma refeição adicionada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {meal.meal_name || MEAL_TYPES.find(m => m.value === meal.meal_type)?.label}
                            </span>
                            {meal.scheduled_time && (
                              <span className="text-sm text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meal.scheduled_time}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-orange-400">
                              {meal.total_calories || 0} kcal
                            </span>
                            <button
                              onClick={() => removeMeal(dayIndex, mealIndex)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
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
                                className="flex items-center justify-between text-sm bg-slate-800 rounded px-3 py-2"
                              >
                                <span className="text-slate-300">
                                  {food.name} - {food.quantity}{food.unit}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400">{food.calories || 0} kcal</span>
                                  <button
                                    onClick={() => removeFood(dayIndex, mealIndex, foodIndex)}
                                    className="text-red-400 hover:text-red-300"
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
                          <div className="flex gap-3 text-xs text-slate-400 mb-3">
                            <span>P: {meal.total_protein?.toFixed(1) || 0}g</span>
                            <span>C: {meal.total_carbs?.toFixed(1) || 0}g</span>
                            <span>G: {meal.total_fat?.toFixed(1) || 0}g</span>
                          </div>
                        )}

                        <button
                          onClick={() => setShowAddFoodModal({ dayIndex, mealIndex })}
                          className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar alimento
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Meal Button */}
                <button
                  onClick={() => setShowAddMealModal({ dayIndex })}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
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
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Adicionar Refeição</h3>
            <div className="grid grid-cols-2 gap-3">
              {MEAL_TYPES.map((mealType) => (
                <button
                  key={mealType.value}
                  onClick={() => addMeal(showAddMealModal.dayIndex, mealType.value)}
                  className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-left"
                >
                  <p className="text-white font-medium">{mealType.label}</p>
                  <p className="text-sm text-slate-400">{mealType.time}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddMealModal(null)}
              className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
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
      <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Adicionar Alimento</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Alimento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Arroz integral"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Unidade
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
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
              <label className="block text-xs text-slate-400 mb-1">Calorias</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Proteína</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Carbos</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gordura</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
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

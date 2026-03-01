// Funções de cálculo nutricional
import type {
  Food,
  MealItem,
  Meal,
  NutritionTotals,
  NutritionProgress,
  NutritionGoals
} from './types'

// Calcular macros de um alimento para uma quantidade específica
export function calculateFoodMacros(food: Food, quantidade: number): NutritionTotals {
  const multiplier = quantidade / food.porcao_padrao
  return {
    calorias: Math.round(food.calorias * multiplier),
    proteinas: Math.round(food.proteinas * multiplier * 10) / 10,
    carboidratos: Math.round(food.carboidratos * multiplier * 10) / 10,
    gorduras: Math.round(food.gorduras * multiplier * 10) / 10,
    fibras: food.fibras ? Math.round(food.fibras * multiplier * 10) / 10 : undefined
  }
}

// Calcular macros de uma refeição (lista de itens)
export function calculateMealMacros(items: MealItem[]): NutritionTotals {
  return items.reduce(
    (totals, item) => ({
      calorias: totals.calorias + item.calorias,
      proteinas: totals.proteinas + item.proteinas,
      carboidratos: totals.carboidratos + item.carboidratos,
      gorduras: totals.gorduras + item.gorduras
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  )
}

// Calcular totais do dia
export function calculateDailyTotals(meals: Meal[]): NutritionTotals {
  return meals.reduce(
    (totals, meal) => ({
      calorias: totals.calorias + (meal.calorias_total || 0),
      proteinas: totals.proteinas + (meal.proteinas_total || 0),
      carboidratos: totals.carboidratos + (meal.carboidratos_total || 0),
      gorduras: totals.gorduras + (meal.gorduras_total || 0)
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  )
}

// Calcular progresso percentual
export function calculateProgress(current: number, goal: number): number {
  if (goal === 0) return 0
  return Math.round((current / goal) * 100)
}

// Calcular progresso de todos os macros
export function calculateNutritionProgress(
  totals: NutritionTotals,
  goals: NutritionGoals
): NutritionProgress {
  return {
    calorias: calculateProgress(totals.calorias, goals.calorias),
    proteinas: calculateProgress(totals.proteinas, goals.proteinas),
    carboidratos: calculateProgress(totals.carboidratos, goals.carboidratos),
    gorduras: calculateProgress(totals.gorduras, goals.gorduras)
  }
}

// Obter status de progresso para cor
export function getProgressStatus(progress: number): 'low' | 'good' | 'over' {
  if (progress < 80) return 'low'
  if (progress <= 105) return 'good'
  return 'over'
}

// Obter cor baseada no progresso
export function getProgressColor(progress: number): string {
  const status = getProgressStatus(progress)
  switch (status) {
    case 'low':
      return 'text-amber-400'
    case 'good':
      return 'text-emerald-400'
    case 'over':
      return 'text-red-400'
  }
}

// Obter cor de fundo baseada no progresso
export function getProgressBgColor(progress: number): string {
  const status = getProgressStatus(progress)
  switch (status) {
    case 'low':
      return 'bg-amber-500'
    case 'good':
      return 'bg-emerald-500'
    case 'over':
      return 'bg-red-500'
  }
}

// Formatar quantidade para exibição
export function formatQuantity(quantidade: number, unidade: string): string {
  if (unidade === 'unidade') {
    return quantidade === 1 ? '1 unidade' : `${quantidade} unidades`
  }
  return `${quantidade}${unidade}`
}

// Formatar macros para exibição resumida
export function formatMacrosSummary(totals: NutritionTotals): string {
  return `${Math.round(totals.calorias)} kcal • ${Math.round(totals.proteinas)}g prot`
}

// Calcular calorias restantes
export function calculateRemainingCalories(current: number, goal: number): number {
  return Math.max(0, goal - current)
}

// Distribuição ideal de macros por refeição (baseado no plano do Leonardo)
export const mealMacroDistribution: Record<string, { calorias: number; proteinas: number }> = {
  cafe_manha: { calorias: 520, proteinas: 35 },
  lanche_manha: { calorias: 180, proteinas: 10 },
  almoco: { calorias: 780, proteinas: 50 },
  lanche_tarde: { calorias: 220, proteinas: 15 },
  pre_treino: { calorias: 250, proteinas: 25 },
  jantar: { calorias: 450, proteinas: 45 },
  ceia: { calorias: 100, proteinas: 10 }
}

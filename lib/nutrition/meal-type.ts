// Vocabulário canônico de tipo de refeição.
//
// - fitness_meals.tipo_refeicao (diário do paciente): PORTUGUÊS ('cafe_manha',
//   'almoco', ...) — canônico. A migration 20260720_fase5_tipo_refeicao_pt.sql
//   converteu as linhas históricas que estavam em inglês.
// - fitness_meal_plan_meals.meal_type (planos da nutri): INGLÊS ('breakfast',
//   'lunch', ...) — vocabulário interno do módulo de planos.
//
// Toda conversão entre os dois mundos passa por este módulo. Não recrie
// mapas locais em páginas/rotas.

import type { MealType } from './types'

export const MEAL_TYPES: MealType[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'pre_treino',
  'jantar',
  'ceia',
]

// Inglês (planos) e variantes legadas → PT canônico
const TO_PT: Record<string, MealType> = {
  breakfast: 'cafe_manha',
  morning_snack: 'lanche_manha',
  lunch: 'almoco',
  afternoon_snack: 'lanche_tarde',
  snack: 'lanche_tarde',
  pre_workout: 'pre_treino',
  dinner: 'jantar',
  supper: 'ceia',
  // variantes legadas encontradas em registros antigos
  cafe: 'cafe_manha',
  lanche: 'lanche_tarde',
}

export const PT_TO_EN: Record<MealType, string> = {
  cafe_manha: 'breakfast',
  lanche_manha: 'morning_snack',
  almoco: 'lunch',
  lanche_tarde: 'afternoon_snack',
  pre_treino: 'pre_workout',
  jantar: 'dinner',
  ceia: 'supper',
}

/**
 * Converte qualquer valor (EN do plano, legado ou já PT) para o MealType
 * canônico. Valores desconhecidos caem no fallback — usar na UI.
 */
export function normalizeMealTypePT(
  raw: string | null | undefined,
  fallback: MealType = 'almoco'
): MealType {
  if (!raw) return fallback
  const key = raw.toLowerCase().trim()
  if (MEAL_TYPES.includes(key as MealType)) return key as MealType
  return TO_PT[key] || fallback
}

/**
 * Versão para escrita no banco: converte EN/legado para PT quando conhecido;
 * valor desconhecido é preservado como veio (não corrompe dados).
 */
export function mealTypeToPT(raw: string): string {
  const key = raw?.toLowerCase().trim()
  if (!key) return raw
  if (MEAL_TYPES.includes(key as MealType)) return key
  return TO_PT[key] || raw
}

/**
 * Converte para o vocabulário do plano (EN) quando conhecido; valor
 * desconhecido é preservado. Usar ao comparar/responder para o módulo de
 * planos (card do paciente, aderência).
 */
export function mealTypeToEN(raw: string): string {
  const key = raw?.toLowerCase().trim()
  if (!key) return raw
  const pt = MEAL_TYPES.includes(key as MealType) ? (key as MealType) : TO_PT[key]
  return pt ? PT_TO_EN[pt] : raw
}

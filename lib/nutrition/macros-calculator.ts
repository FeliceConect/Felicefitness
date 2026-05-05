/**
 * Calculador de metas nutricionais com cadeia de prioridade.
 *
 * Ordem de fontes (primeira disponível ganha):
 *   1. Plano alimentar definido pela nutricionista (calories_target, etc.)
 *   2. Metas configuradas no perfil do paciente (meta_calorias_diarias, etc.)
 *   3. Cálculo dinâmico baseado em peso, altura, sexo, idade, atividade,
 *      objetivo (e bioimpedância quando disponível para mais precisão).
 *   4. Fallback genérico (último recurso de emergência).
 *
 * O hook `use-nutrition-goals` monta os inputs e chama esta função.
 */

import type { NutritionGoals } from './types'

// ============================================================
// INPUTS
// ============================================================

export interface MacrosCalculationInput {
  /** Plano alimentar do paciente (vinculado pela nutri). Prioridade máxima. */
  mealPlan?: {
    calories_target?: number | null
    protein_target?: number | null
    carbs_target?: number | null
    fat_target?: number | null
  } | null

  /** Perfil do paciente (metas manuais + dados antropométricos). */
  profile?: {
    meta_calorias_diarias?: number | null
    meta_proteina_g?: number | null
    meta_carboidrato_g?: number | null
    meta_gordura_g?: number | null
    meta_agua_ml?: number | null
    sexo?: string | null
    altura_cm?: number | null
    peso_atual?: number | null
    data_nascimento?: string | null
    nivel_atividade?: string | null
    objetivo?: string | null
  } | null

  /** Bioimpedância mais recente (para cálculo de proteína por massa magra). */
  bioimpedance?: {
    peso?: number | null
    massa_livre_gordura_kg?: number | null
    taxa_metabolica_basal?: number | null
  } | null
}

// ============================================================
// CONSTANTES
// ============================================================

/** Multiplicador de atividade física aplicado ao TMB para chegar no TDEE. */
const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muito_intenso: 1.9,
}

/** Ajuste calórico por objetivo (% sobre o TDEE). */
const OBJECTIVE_CALORIE_ADJUST: Record<string, number> = {
  emagrecimento: -0.20,   // déficit 20%
  perda_peso: -0.20,
  manutencao: 0,
  saude: 0,
  hipertrofia: 0.10,      // superávit 10%
  ganho_massa: 0.10,
}

/** g de proteína por kg de peso corporal por objetivo. */
const PROTEIN_PER_KG: Record<string, number> = {
  emagrecimento: 2.0,
  perda_peso: 2.0,
  hipertrofia: 2.0,
  ganho_massa: 2.0,
  manutencao: 1.6,
  saude: 1.6,
}

/** g de proteína por kg de massa magra (quando há bioimpedância). */
const PROTEIN_PER_KG_LEAN: Record<string, number> = {
  emagrecimento: 2.4,
  perda_peso: 2.4,
  hipertrofia: 2.4,
  ganho_massa: 2.4,
  manutencao: 2.0,
  saude: 2.0,
}

/** Percentual das calorias destinadas a gorduras. */
const FAT_PERCENT_OF_CALORIES = 0.25

/** Fallback final se faltar tudo. */
const DEFAULT_GOALS: NutritionGoals = {
  calorias: 2000,
  proteinas: 130,
  carboidratos: 220,
  gorduras: 60,
  agua: 2000,
}

// ============================================================
// API PRINCIPAL
// ============================================================

/**
 * Calcula as metas nutricionais respeitando a cadeia de prioridade.
 * Sempre retorna um NutritionGoals válido — nunca null.
 */
export function calculateNutritionGoals(input: MacrosCalculationInput): NutritionGoals {
  const water = input.profile?.meta_agua_ml ?? 2000

  // 1. Plano alimentar tem prioridade absoluta
  const fromPlan = goalsFromMealPlan(input.mealPlan)
  if (fromPlan) return { ...fromPlan, agua: water }

  // 2. Metas manuais do perfil
  const fromProfile = goalsFromProfile(input.profile)
  if (fromProfile) return { ...fromProfile, agua: water }

  // 3. Cálculo dinâmico (precisa de peso + altura + sexo + idade)
  const calculated = calculateFromBody(input.profile, input.bioimpedance)
  if (calculated) return { ...calculated, agua: water }

  // 4. Fallback final
  return { ...DEFAULT_GOALS, agua: water }
}

// ============================================================
// FONTE 1 — PLANO ALIMENTAR
// ============================================================

function goalsFromMealPlan(
  plan: MacrosCalculationInput['mealPlan']
): Omit<NutritionGoals, 'agua'> | null {
  if (!plan) return null
  const cal = plan.calories_target
  if (!cal || cal <= 0) return null

  // Se a nutri preencheu calorias, usamos. Macros ausentes caem em distribuição padrão.
  return {
    calorias: cal,
    proteinas: plan.protein_target ?? Math.round((cal * 0.30) / 4),
    carboidratos: plan.carbs_target ?? Math.round((cal * 0.45) / 4),
    gorduras: plan.fat_target ?? Math.round((cal * 0.25) / 9),
  }
}

// ============================================================
// FONTE 2 — METAS DO PERFIL
// ============================================================

function goalsFromProfile(
  profile: MacrosCalculationInput['profile']
): Omit<NutritionGoals, 'agua'> | null {
  if (!profile) return null
  const cal = profile.meta_calorias_diarias
  if (!cal || cal <= 0) return null

  return {
    calorias: cal,
    proteinas: profile.meta_proteina_g ?? Math.round((cal * 0.30) / 4),
    carboidratos: profile.meta_carboidrato_g ?? Math.round((cal * 0.45) / 4),
    gorduras: profile.meta_gordura_g ?? Math.round((cal * 0.25) / 9),
  }
}

// ============================================================
// FONTE 3 — CÁLCULO DINÂMICO
// ============================================================

function calculateFromBody(
  profile: MacrosCalculationInput['profile'],
  bio: MacrosCalculationInput['bioimpedance']
): Omit<NutritionGoals, 'agua'> | null {
  const peso = bio?.peso ?? profile?.peso_atual
  const altura = profile?.altura_cm
  const sexo = normalizeSex(profile?.sexo)
  const idade = ageFromBirthdate(profile?.data_nascimento)

  if (!peso || !altura || !sexo || !idade) return null

  // TMB: usa o da bioimpedância se disponível (mais preciso), senão Mifflin-St Jeor
  const tmb = bio?.taxa_metabolica_basal && bio.taxa_metabolica_basal > 0
    ? bio.taxa_metabolica_basal
    : mifflinStJeor(peso, altura, idade, sexo)

  // TDEE = TMB × fator de atividade
  const activityFactor = ACTIVITY_FACTORS[normalizeActivity(profile?.nivel_atividade)] ?? 1.55
  const tdee = tmb * activityFactor

  // Ajuste por objetivo (déficit/superávit)
  const objective = normalizeObjective(profile?.objetivo)
  const calAdjust = OBJECTIVE_CALORIE_ADJUST[objective] ?? 0
  const calorias = Math.round(tdee * (1 + calAdjust))

  // Proteína: priorize massa magra se disponível
  const massaMagra = bio?.massa_livre_gordura_kg
  const proteinas = massaMagra && massaMagra > 0
    ? Math.round(massaMagra * (PROTEIN_PER_KG_LEAN[objective] ?? 2.0))
    : Math.round(peso * (PROTEIN_PER_KG[objective] ?? 1.6))

  // Gordura: 25% das calorias / 9 kcal por grama
  const gorduras = Math.round((calorias * FAT_PERCENT_OF_CALORIES) / 9)

  // Carboidrato: o que sobrou após proteína (4kcal/g) e gordura (9kcal/g)
  const calRestantes = calorias - proteinas * 4 - gorduras * 9
  const carboidratos = Math.max(0, Math.round(calRestantes / 4))

  return { calorias, proteinas, carboidratos, gorduras }
}

// ============================================================
// HELPERS
// ============================================================

/** Mifflin-St Jeor — fórmula padrão moderna para TMB. */
function mifflinStJeor(peso: number, altura: number, idade: number, sexo: 'M' | 'F'): number {
  const base = 10 * peso + 6.25 * altura - 5 * idade
  return sexo === 'M' ? base + 5 : base - 161
}

function ageFromBirthdate(birthdate?: string | null): number | null {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age > 0 && age < 120 ? age : null
}

function normalizeSex(sexo?: string | null): 'M' | 'F' | null {
  if (!sexo) return null
  const s = sexo.toLowerCase()
  if (s.startsWith('m') || s === 'masculino' || s === 'male') return 'M'
  if (s.startsWith('f') || s === 'feminino' || s === 'female') return 'F'
  return null
}

function normalizeActivity(nivel?: string | null): string {
  if (!nivel) return 'moderado'
  const s = nivel.toLowerCase().replace(/\s+/g, '_')
  if (s in ACTIVITY_FACTORS) return s
  return 'moderado'
}

function normalizeObjective(obj?: string | null): string {
  if (!obj) return 'manutencao'
  const s = obj.toLowerCase().replace(/\s+/g, '_').replace(/[áàâã]/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/[óô]/g, 'o').replace(/ú/g, 'u')
  if (s in OBJECTIVE_CALORIE_ADJUST) return s
  return 'manutencao'
}

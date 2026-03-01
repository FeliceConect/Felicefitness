// Calculador de XP - Complexo Wellness Gamification

import type { XPEventType, XPEvent } from '@/types/gamification'

/**
 * Valores de XP por tipo de evento
 */
export const XP_VALUES: Record<XPEventType, number> = {
  // Treino (maiores valores)
  workout_completed: 100,        // Treino completo
  workout_all_sets: 25,          // Bônus: todas as séries
  personal_record: 50,           // Recorde pessoal

  // Nutrição
  meal_logged: 15,               // Refeição registrada
  meal_photo_ai: 10,             // Bônus: análise de foto com IA
  all_meals_logged: 30,          // Bônus: todas as refeições do dia
  protein_goal_met: 20,          // Meta de proteína atingida
  calories_on_target: 20,        // Calorias dentro da meta (±10%)

  // Hidratação
  water_logged: 5,               // Água registrada (por copo)
  water_goal_50: 10,             // 50% da meta de água
  water_goal_100: 25,            // 100% da meta de água

  // Corpo
  weight_logged: 15,             // Peso registrado
  bioimpedance_logged: 25,       // Bioimpedância registrada
  progress_photo: 30,            // Foto de progresso

  // Consistência
  daily_checkin: 10,             // Check-in diário
  streak_bonus: 0,               // Calculado dinamicamente baseado no streak

  // Especiais
  weekly_goal_met: 50,           // Meta semanal atingida
  first_of_type: 25,             // Primeira vez fazendo algo
  comeback: 50,                  // Voltou após 3+ dias de inatividade
  achievement_unlocked: 0,       // XP vem da conquista em si
  challenge_completed: 0,        // XP vem do desafio em si
  level_up: 0                    // Não dá XP adicional
}

/**
 * Calcula bônus de streak
 * Multiplica por 5 XP por dia de streak (máx 50)
 */
export function calculateStreakBonus(streakDays: number): number {
  if (streakDays <= 1) return 0
  return Math.min(streakDays * 5, 50)
}

/**
 * Calcula XP total do dia baseado nas atividades
 */
export interface DailyXPBreakdown {
  workout: number
  nutrition: number
  hydration: number
  body: number
  consistency: number
  bonuses: number
  total: number
}

export function calculateDailyXP(activities: {
  workoutCompleted?: boolean
  workoutAllSets?: boolean
  personalRecords?: number
  mealsLogged?: number
  usedPhotoAI?: boolean
  allMealsLogged?: boolean
  proteinGoalMet?: boolean
  caloriesOnTarget?: boolean
  waterGlasses?: number
  waterGoal50?: boolean
  waterGoal100?: boolean
  weightLogged?: boolean
  bioimpedanceLogged?: boolean
  progressPhoto?: boolean
  checkinDone?: boolean
  streakDays?: number
}): DailyXPBreakdown {
  let workout = 0
  let nutrition = 0
  let hydration = 0
  let body = 0
  let consistency = 0
  let bonuses = 0

  // Treino
  if (activities.workoutCompleted) {
    workout += XP_VALUES.workout_completed
    if (activities.workoutAllSets) {
      workout += XP_VALUES.workout_all_sets
    }
  }
  if (activities.personalRecords) {
    workout += XP_VALUES.personal_record * activities.personalRecords
  }

  // Nutrição
  if (activities.mealsLogged) {
    nutrition += XP_VALUES.meal_logged * activities.mealsLogged
  }
  if (activities.usedPhotoAI) {
    nutrition += XP_VALUES.meal_photo_ai
  }
  if (activities.allMealsLogged) {
    nutrition += XP_VALUES.all_meals_logged
  }
  if (activities.proteinGoalMet) {
    nutrition += XP_VALUES.protein_goal_met
  }
  if (activities.caloriesOnTarget) {
    nutrition += XP_VALUES.calories_on_target
  }

  // Hidratação
  if (activities.waterGlasses) {
    hydration += XP_VALUES.water_logged * activities.waterGlasses
  }
  if (activities.waterGoal50) {
    hydration += XP_VALUES.water_goal_50
  }
  if (activities.waterGoal100) {
    hydration += XP_VALUES.water_goal_100
  }

  // Corpo
  if (activities.weightLogged) {
    body += XP_VALUES.weight_logged
  }
  if (activities.bioimpedanceLogged) {
    body += XP_VALUES.bioimpedance_logged
  }
  if (activities.progressPhoto) {
    body += XP_VALUES.progress_photo
  }

  // Consistência
  if (activities.checkinDone) {
    consistency += XP_VALUES.daily_checkin
  }

  // Bônus de streak
  if (activities.streakDays) {
    bonuses += calculateStreakBonus(activities.streakDays)
  }

  return {
    workout,
    nutrition,
    hydration,
    body,
    consistency,
    bonuses,
    total: workout + nutrition + hydration + body + consistency + bonuses
  }
}

/**
 * Cria um evento de XP
 */
export function createXPEvent(
  type: XPEventType,
  amount?: number,
  reason?: string
): Omit<XPEvent, 'id'> {
  return {
    type,
    amount: amount ?? XP_VALUES[type],
    reason: reason ?? getDefaultReason(type),
    timestamp: new Date()
  }
}

/**
 * Obtém razão padrão para tipo de evento
 */
function getDefaultReason(type: XPEventType): string {
  const reasons: Record<XPEventType, string> = {
    workout_completed: 'Treino completo',
    workout_all_sets: 'Todas as séries completadas',
    personal_record: 'Novo recorde pessoal',
    meal_logged: 'Refeição registrada',
    meal_photo_ai: 'Análise de foto com IA',
    all_meals_logged: 'Todas as refeições do dia',
    protein_goal_met: 'Meta de proteína atingida',
    calories_on_target: 'Calorias dentro da meta',
    water_logged: 'Água registrada',
    water_goal_50: '50% da meta de água',
    water_goal_100: 'Meta de água atingida',
    weight_logged: 'Peso registrado',
    bioimpedance_logged: 'Bioimpedância registrada',
    progress_photo: 'Foto de progresso',
    daily_checkin: 'Check-in diário',
    streak_bonus: 'Bônus de sequência',
    weekly_goal_met: 'Meta semanal atingida',
    first_of_type: 'Primeira vez',
    comeback: 'Retorno após inatividade',
    achievement_unlocked: 'Conquista desbloqueada',
    challenge_completed: 'Desafio completado',
    level_up: 'Subiu de nível'
  }

  return reasons[type] || 'XP ganho'
}

/**
 * Obtém ícone para tipo de XP
 */
export function getXPTypeIcon(type: XPEventType): string {
  const icons: Record<XPEventType, string> = {
    workout_completed: '💪',
    workout_all_sets: '✅',
    personal_record: '🏆',
    meal_logged: '🍽️',
    meal_photo_ai: '📸',
    all_meals_logged: '🌟',
    protein_goal_met: '🥩',
    calories_on_target: '🎯',
    water_logged: '💧',
    water_goal_50: '🌊',
    water_goal_100: '🌊',
    weight_logged: '⚖️',
    bioimpedance_logged: '📊',
    progress_photo: '📷',
    daily_checkin: '✨',
    streak_bonus: '🔥',
    weekly_goal_met: '🏅',
    first_of_type: '🆕',
    comeback: '🔙',
    achievement_unlocked: '🎖️',
    challenge_completed: '🎯',
    level_up: '⬆️'
  }

  return icons[type] || '⭐'
}

/**
 * Calcula XP máximo possível em um dia perfeito
 */
export function getMaxDailyXP(): number {
  return calculateDailyXP({
    workoutCompleted: true,
    workoutAllSets: true,
    personalRecords: 1,
    mealsLogged: 5,
    usedPhotoAI: true,
    allMealsLogged: true,
    proteinGoalMet: true,
    caloriesOnTarget: true,
    waterGlasses: 8,
    waterGoal50: true,
    waterGoal100: true,
    weightLogged: true,
    bioimpedanceLogged: false, // Não é diário
    progressPhoto: false,       // Não é diário
    checkinDone: true,
    streakDays: 10
  }).total
}

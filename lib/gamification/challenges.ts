// Sistema de Desafios - Complexo Wellness Gamification

import type { Challenge, ActiveChallenge, ChallengeType } from '@/types/gamification'
import { getTodayDateSP } from '@/lib/utils/date'

/**
 * Desafios diários disponíveis
 */
export const DAILY_CHALLENGES: Challenge[] = [
  // Treino
  {
    id: 'daily_early_workout',
    name: 'Madrugador',
    description: 'Complete um treino antes das 7h',
    icon: '🌅',
    type: 'daily',
    xpReward: 50,
    criteria: { type: 'early_workout', time: '07:00' }
  },
  {
    id: 'daily_full_workout',
    name: 'Sem Falhas',
    description: 'Complete todas as séries do treino',
    icon: '💪',
    type: 'daily',
    xpReward: 30,
    criteria: { type: 'full_workout' }
  },
  {
    id: 'daily_pr',
    name: 'Quebre Limites',
    description: 'Estabeleça um novo recorde pessoal',
    icon: '🏆',
    type: 'daily',
    xpReward: 75,
    criteria: { type: 'personal_record', value: 1 }
  },

  // Nutrição
  {
    id: 'daily_all_meals',
    name: 'Diário Completo',
    description: 'Registre todas as refeições do dia',
    icon: '📝',
    type: 'daily',
    xpReward: 35,
    criteria: { type: 'all_meals' }
  },
  {
    id: 'daily_protein',
    name: 'Meta Proteica',
    description: 'Atinja 100% da meta de proteína',
    icon: '🥩',
    type: 'daily',
    xpReward: 40,
    criteria: { type: 'protein_goal' }
  },
  {
    id: 'daily_perfect_macros',
    name: 'Macros Alinhados',
    description: 'Fique dentro de ±5% da meta de calorias',
    icon: '🎯',
    type: 'daily',
    xpReward: 50,
    criteria: { type: 'perfect_macros' }
  },
  {
    id: 'daily_breakfast',
    name: 'Café Reforçado',
    description: 'Tome café da manhã com 30g+ de proteína',
    icon: '🍳',
    type: 'daily',
    xpReward: 30,
    criteria: { type: 'protein_meal', meal: 'cafe_manha', value: 30 }
  },

  // Hidratação
  {
    id: 'daily_hydration',
    name: 'Hidratação Máxima',
    description: 'Beba 100% da meta de água',
    icon: '💧',
    type: 'daily',
    xpReward: 30,
    criteria: { type: 'water_goal' }
  },
  {
    id: 'daily_super_hydration',
    name: 'Super Hidratado',
    description: 'Beba 120% da meta de água',
    icon: '🌊',
    type: 'daily',
    xpReward: 45,
    criteria: { type: 'water_overachieve', value: 120 }
  },

  // Extras
  {
    id: 'daily_checkin_early',
    name: 'Check-in Matinal',
    description: 'Faça o check-in antes das 8h',
    icon: '☀️',
    type: 'daily',
    xpReward: 25,
    criteria: { type: 'early_checkin', time: '08:00' }
  },
  {
    id: 'daily_perfect_day',
    name: 'Dia Perfeito',
    description: 'Alcance pontuação 100 hoje',
    icon: '💯',
    type: 'daily',
    xpReward: 100,
    criteria: { type: 'perfect_score' }
  }
]

/**
 * Desafios semanais disponíveis
 */
export const WEEKLY_CHALLENGES: Challenge[] = [
  // Treino
  {
    id: 'weekly_5_workouts',
    name: 'Semana de Guerreiro',
    description: 'Complete 5 treinos esta semana',
    icon: '⚔️',
    type: 'weekly',
    xpReward: 150,
    criteria: { type: 'workouts', value: 5 }
  },
  {
    id: 'weekly_all_workouts',
    name: 'Sem Faltas',
    description: 'Complete todos os treinos agendados',
    icon: '✅',
    type: 'weekly',
    xpReward: 200,
    criteria: { type: 'all_scheduled_workouts' }
  },
  {
    id: 'weekly_3_prs',
    name: 'Evolução Constante',
    description: 'Estabeleça 3 recordes pessoais',
    icon: '📈',
    type: 'weekly',
    xpReward: 175,
    criteria: { type: 'personal_records', value: 3 }
  },

  // Nutrição
  {
    id: 'weekly_all_meals_5',
    name: 'Disciplina Alimentar',
    description: 'Registre todas as refeições em 5 dias',
    icon: '🥗',
    type: 'weekly',
    xpReward: 125,
    criteria: { type: 'perfect_meal_days', value: 5 }
  },
  {
    id: 'weekly_protein_streak',
    name: 'Semana Proteica',
    description: 'Atinja a meta de proteína 7 dias seguidos',
    icon: '💪',
    type: 'weekly',
    xpReward: 200,
    criteria: { type: 'protein_streak', value: 7 }
  },
  {
    id: 'weekly_ai_photos',
    name: 'Fotógrafo Fit',
    description: 'Use a IA para analisar 5 refeições',
    icon: '📸',
    type: 'weekly',
    xpReward: 100,
    criteria: { type: 'ai_analyses', value: 5 }
  },

  // Hidratação
  {
    id: 'weekly_water_streak',
    name: 'Semana Hidratada',
    description: 'Atinja a meta de água 7 dias seguidos',
    icon: '🌊',
    type: 'weekly',
    xpReward: 150,
    criteria: { type: 'water_streak', value: 7 }
  },

  // Consistência
  {
    id: 'weekly_checkin_streak',
    name: 'Check-in Perfeito',
    description: 'Faça check-in todos os dias da semana',
    icon: '✨',
    type: 'weekly',
    xpReward: 100,
    criteria: { type: 'checkin_streak', value: 7 }
  },
  {
    id: 'weekly_high_score',
    name: 'Média Alta',
    description: 'Mantenha média de pontuação acima de 80',
    icon: '⭐',
    type: 'weekly',
    xpReward: 175,
    criteria: { type: 'average_score', value: 80 }
  },
  {
    id: 'weekly_perfect_days',
    name: 'Excelência',
    description: 'Tenha 3 dias perfeitos na semana',
    icon: '👑',
    type: 'weekly',
    xpReward: 250,
    criteria: { type: 'perfect_days', value: 3 }
  }
]

/**
 * Desafios especiais (eventos)
 */
export const SPECIAL_CHALLENGES: Challenge[] = [
  {
    id: 'special_new_year',
    name: 'Ano Novo, Vida Nova',
    description: 'Complete 7 dias seguidos em Janeiro',
    icon: '🎆',
    type: 'special',
    xpReward: 300,
    criteria: { type: 'streak', value: 7 },
    startDate: '2025-01-01',
    endDate: '2025-01-31'
  },
  {
    id: 'special_carnival',
    name: 'Carnaval Fitness',
    description: 'Treine durante o Carnaval',
    icon: '🎭',
    type: 'special',
    xpReward: 200,
    criteria: { type: 'workout_on_dates' },
    startDate: '2025-03-01',
    endDate: '2025-03-05'
  },
  {
    id: 'special_birthday',
    name: 'Aniversário Saudável',
    description: 'Treine no seu aniversário',
    icon: '🎂',
    type: 'special',
    xpReward: 100,
    criteria: { type: 'birthday_workout' }
  }
]

/**
 * Todos os desafios
 */
export const ALL_CHALLENGES = [
  ...DAILY_CHALLENGES,
  ...WEEKLY_CHALLENGES,
  ...SPECIAL_CHALLENGES
]

/**
 * Obtém desafios por tipo
 */
export function getChallengesByType(type: ChallengeType): Challenge[] {
  return ALL_CHALLENGES.filter(c => c.type === type)
}

/**
 * Obtém um desafio pelo ID
 */
export function getChallengeById(id: string): Challenge | undefined {
  return ALL_CHALLENGES.find(c => c.id === id)
}

/**
 * Seleciona desafios diários aleatórios
 * Retorna 3 desafios variados
 */
export function selectDailyChallenges(count: number = 3): Challenge[] {
  const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Seleciona desafios semanais aleatórios
 * Retorna 2 desafios variados
 */
export function selectWeeklyChallenges(count: number = 2): Challenge[] {
  const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Obtém desafios especiais ativos para a data atual
 */
export function getActiveSpecialChallenges(date?: Date): Challenge[] {
  const dateString = date ? date.toISOString().split('T')[0] : getTodayDateSP()

  return SPECIAL_CHALLENGES.filter(challenge => {
    if (!challenge.startDate || !challenge.endDate) return false
    return dateString >= challenge.startDate && dateString <= challenge.endDate
  })
}

/**
 * Converte desafio para desafio ativo
 */
export function activateChallenge(
  challenge: Challenge,
  progress: number = 0,
  expiresAt?: Date
): ActiveChallenge {
  // Determinar target baseado no critério
  const target = challenge.criteria.value || 1

  return {
    ...challenge,
    progress,
    target,
    expiresAt,
    completed: progress >= target
  }
}

/**
 * Atualiza progresso de um desafio
 */
export function updateChallengeProgress(
  challenge: ActiveChallenge,
  newProgress: number
): ActiveChallenge {
  const updatedProgress = Math.min(newProgress, challenge.target)

  return {
    ...challenge,
    progress: updatedProgress,
    completed: updatedProgress >= challenge.target
  }
}

/**
 * Verifica se desafio expirou
 */
export function isChallengeExpired(challenge: ActiveChallenge): boolean {
  if (!challenge.expiresAt) return false
  return new Date() > challenge.expiresAt
}

/**
 * Obtém tempo restante para desafio
 */
export function getChallengeTimeRemaining(challenge: ActiveChallenge): {
  hours: number
  minutes: number
  expired: boolean
  label: string
} {
  if (!challenge.expiresAt) {
    return { hours: 0, minutes: 0, expired: false, label: 'Sem prazo' }
  }

  const now = new Date()
  const expiresAt = typeof challenge.expiresAt === 'string'
    ? new Date(challenge.expiresAt)
    : challenge.expiresAt
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true, label: 'Expirado' }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  let label = ''
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    label = `${days} dia${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m`
  } else {
    label = `${minutes}m`
  }

  return { hours, minutes, expired: false, label }
}

/**
 * Obtém data de expiração para desafio diário
 */
export function getDailyExpirationDate(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Obtém data de expiração para desafio semanal
 * Expira no próximo domingo à meia-noite
 */
export function getWeeklyExpirationDate(): Date {
  const now = new Date()
  const daysUntilSunday = 7 - now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + daysUntilSunday)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/**
 * Gera desafios ativos para o dia
 */
export function generateDailyChallenges(): ActiveChallenge[] {
  const challenges = selectDailyChallenges(3)
  const expiresAt = getDailyExpirationDate()

  return challenges.map(c => activateChallenge(c, 0, expiresAt))
}

/**
 * Gera desafios ativos para a semana
 */
export function generateWeeklyChallenges(): ActiveChallenge[] {
  const challenges = selectWeeklyChallenges(2)
  const expiresAt = getWeeklyExpirationDate()

  return challenges.map(c => activateChallenge(c, 0, expiresAt))
}

/**
 * Obtém cor do desafio baseado no tipo
 */
export function getChallengeTypeColor(type: ChallengeType): string {
  const colors: Record<ChallengeType, string> = {
    daily: '#8B5CF6',   // Violeta
    weekly: '#3B82F6',  // Azul
    special: '#F59E0B'  // Laranja
  }
  return colors[type]
}

/**
 * Obtém label do tipo de desafio
 */
export function getChallengeTypeLabel(type: ChallengeType): string {
  const labels: Record<ChallengeType, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    special: 'Especial'
  }
  return labels[type]
}

/**
 * Calcula progresso percentual de um desafio
 */
export function getChallengeProgressPercentage(challenge: ActiveChallenge): number {
  if (challenge.target === 0) return 0
  return Math.min(100, Math.round((challenge.progress / challenge.target) * 100))
}

// Sistema de Conquistas - FeliceFit Gamification

import type {
  Achievement,
  AchievementCategory,
  AchievementTier,
  UserStats
} from '@/types/gamification'

/**
 * XP por tier de conquista
 */
export const TIER_XP: Record<AchievementTier, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 350,
  diamond: 500
}

/**
 * Cores por tier
 */
export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF'
}

/**
 * Gradientes por tier
 */
export const TIER_GRADIENTS: Record<AchievementTier, string> = {
  bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
  silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
  gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  platinum: 'linear-gradient(135deg, #E5E4E2 0%, #B8B8B8 50%, #E5E4E2 100%)',
  diamond: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 50%, #87CEEB 100%)'
}

/**
 * Todas as conquistas do sistema
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ========== STREAK (10 conquistas) ==========
  {
    id: 'streak_3',
    name: 'Primeira Faísca',
    description: '3 dias consecutivos de atividade',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'streak', value: 3 }
  },
  {
    id: 'streak_7',
    name: 'Semana de Fogo',
    description: '7 dias consecutivos de atividade',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'streak', value: 7 }
  },
  {
    id: 'streak_14',
    name: 'Duas Semanas',
    description: '14 dias consecutivos de atividade',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'streak', value: 14 }
  },
  {
    id: 'streak_30',
    name: 'Mês de Ferro',
    description: '30 dias consecutivos de atividade',
    icon: '🔥',
    category: 'streak',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'streak', value: 30 }
  },
  {
    id: 'streak_60',
    name: 'Disciplina Total',
    description: '60 dias consecutivos de atividade',
    icon: '💎',
    category: 'streak',
    tier: 'platinum',
    xpReward: TIER_XP.platinum,
    criteria: { type: 'streak', value: 60 }
  },
  {
    id: 'streak_90',
    name: 'Trimestre de Ouro',
    description: '90 dias consecutivos de atividade',
    icon: '👑',
    category: 'streak',
    tier: 'platinum',
    xpReward: TIER_XP.platinum,
    criteria: { type: 'streak', value: 90 }
  },
  {
    id: 'streak_180',
    name: 'Meio Ano Invicto',
    description: '180 dias consecutivos de atividade',
    icon: '🌟',
    category: 'streak',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'streak', value: 180 }
  },
  {
    id: 'streak_365',
    name: 'Ano Imortal',
    description: '365 dias consecutivos de atividade',
    icon: '🔱',
    category: 'streak',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'streak', value: 365 }
  },
  {
    id: 'streak_comeback',
    name: 'Fênix',
    description: 'Voltou após 7+ dias de inatividade e completou 3 dias',
    icon: '🐦‍🔥',
    category: 'streak',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'comeback', value: 3 }
  },
  {
    id: 'streak_never_quit',
    name: 'Nunca Desistiu',
    description: 'Recuperou o streak 3 vezes após perdê-lo',
    icon: '💪',
    category: 'streak',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'streak_recoveries', value: 3 }
  },

  // ========== WORKOUT (12 conquistas) ==========
  {
    id: 'workout_1',
    name: 'Primeiro Treino',
    description: 'Complete seu primeiro treino',
    icon: '🏋️',
    category: 'workout',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'workouts_completed', value: 1 }
  },
  {
    id: 'workout_10',
    name: 'Dez Vitórias',
    description: 'Complete 10 treinos',
    icon: '🏋️',
    category: 'workout',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'workouts_completed', value: 10 }
  },
  {
    id: 'workout_50',
    name: 'Cinquenta Batalhas',
    description: 'Complete 50 treinos',
    icon: '⚔️',
    category: 'workout',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'workouts_completed', value: 50 }
  },
  {
    id: 'workout_100',
    name: 'Centurião',
    description: 'Complete 100 treinos',
    icon: '🛡️',
    category: 'workout',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'workouts_completed', value: 100 }
  },
  {
    id: 'workout_250',
    name: 'Veterano',
    description: 'Complete 250 treinos',
    icon: '🎖️',
    category: 'workout',
    tier: 'platinum',
    xpReward: TIER_XP.platinum,
    criteria: { type: 'workouts_completed', value: 250 }
  },
  {
    id: 'workout_500',
    name: 'Lenda da Academia',
    description: 'Complete 500 treinos',
    icon: '🏆',
    category: 'workout',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'workouts_completed', value: 500 }
  },
  {
    id: 'pr_1',
    name: 'Primeiro PR',
    description: 'Quebre seu primeiro recorde pessoal',
    icon: '📈',
    category: 'workout',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'personal_records', value: 1 }
  },
  {
    id: 'pr_10',
    name: 'Quebrando Limites',
    description: 'Quebre 10 recordes pessoais',
    icon: '📈',
    category: 'workout',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'personal_records', value: 10 }
  },
  {
    id: 'pr_50',
    name: 'Sem Limites',
    description: 'Quebre 50 recordes pessoais',
    icon: '🚀',
    category: 'workout',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'personal_records', value: 50 }
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Complete um treino antes das 6h',
    icon: '🌅',
    category: 'workout',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'early_workout', time: '06:00' }
  },
  {
    id: 'early_bird_10',
    name: 'Amanhecer de Campeão',
    description: 'Complete 10 treinos antes das 6h',
    icon: '🌅',
    category: 'workout',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'early_workouts', value: 10 }
  },
  {
    id: 'all_sets_10',
    name: 'Perfeccionista',
    description: 'Complete todas as séries em 10 treinos',
    icon: '✅',
    category: 'workout',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'perfect_workouts', value: 10 }
  },

  // ========== NUTRITION (10 conquistas) ==========
  {
    id: 'meal_1',
    name: 'Primeira Refeição',
    description: 'Registre sua primeira refeição',
    icon: '🍽️',
    category: 'nutrition',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'meals_logged', value: 1 }
  },
  {
    id: 'meal_50',
    name: 'Diário Alimentar',
    description: 'Registre 50 refeições',
    icon: '📝',
    category: 'nutrition',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'meals_logged', value: 50 }
  },
  {
    id: 'meal_200',
    name: 'Nutricionista Pessoal',
    description: 'Registre 200 refeições',
    icon: '🥗',
    category: 'nutrition',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'meals_logged', value: 200 }
  },
  {
    id: 'meal_500',
    name: 'Mestre da Nutrição',
    description: 'Registre 500 refeições',
    icon: '👨‍🍳',
    category: 'nutrition',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'meals_logged', value: 500 }
  },
  {
    id: 'ai_photo_1',
    name: 'Olho Digital',
    description: 'Use a IA para analisar uma refeição',
    icon: '📸',
    category: 'nutrition',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'ai_analyses', value: 1 }
  },
  {
    id: 'ai_photo_25',
    name: 'Fotógrafo Fit',
    description: 'Use a IA para analisar 25 refeições',
    icon: '📷',
    category: 'nutrition',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'ai_analyses', value: 25 }
  },
  {
    id: 'protein_7',
    name: 'Semana Proteica',
    description: 'Atinja a meta de proteína 7 dias seguidos',
    icon: '🥩',
    category: 'nutrition',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'protein_streak', value: 7 }
  },
  {
    id: 'protein_30',
    name: 'Mês de Proteína',
    description: 'Atinja a meta de proteína 30 dias seguidos',
    icon: '💪',
    category: 'nutrition',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'protein_streak', value: 30 }
  },
  {
    id: 'macros_perfect',
    name: 'Macros Perfeitos',
    description: 'Fique dentro da meta de todos os macros em um dia',
    icon: '🎯',
    category: 'nutrition',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'perfect_macros', value: 1 }
  },
  {
    id: 'macros_perfect_7',
    name: 'Semana Perfeita',
    description: 'Macros perfeitos por 7 dias seguidos',
    icon: '⭐',
    category: 'nutrition',
    tier: 'platinum',
    xpReward: TIER_XP.platinum,
    criteria: { type: 'perfect_macros_streak', value: 7 }
  },

  // ========== HYDRATION (8 conquistas) ==========
  {
    id: 'water_1',
    name: 'Primeira Gota',
    description: 'Registre sua primeira água',
    icon: '💧',
    category: 'hydration',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'water_logged', value: 1 }
  },
  {
    id: 'water_goal_1',
    name: 'Hidratado',
    description: 'Atinja a meta de água pela primeira vez',
    icon: '🌊',
    category: 'hydration',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'water_goals_met', value: 1 }
  },
  {
    id: 'water_goal_7',
    name: 'Semana Hidratada',
    description: 'Atinja a meta de água por 7 dias seguidos',
    icon: '🌊',
    category: 'hydration',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'water_streak', value: 7 }
  },
  {
    id: 'water_goal_30',
    name: 'Mês de Água',
    description: 'Atinja a meta de água por 30 dias seguidos',
    icon: '🌊',
    category: 'hydration',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'water_streak', value: 30 }
  },
  {
    id: 'water_100l',
    name: '100 Litros',
    description: 'Beba um total de 100 litros de água',
    icon: '🚰',
    category: 'hydration',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'total_water', value: 100 }
  },
  {
    id: 'water_500l',
    name: '500 Litros',
    description: 'Beba um total de 500 litros de água',
    icon: '🏊',
    category: 'hydration',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'total_water', value: 500 }
  },
  {
    id: 'water_1000l',
    name: 'Oceano',
    description: 'Beba um total de 1000 litros de água',
    icon: '🌏',
    category: 'hydration',
    tier: 'platinum',
    xpReward: TIER_XP.platinum,
    criteria: { type: 'total_water', value: 1000 }
  },
  {
    id: 'water_overachiever',
    name: 'Super Hidratado',
    description: 'Beba 150% da meta de água em um dia',
    icon: '💦',
    category: 'hydration',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'water_overachieve', value: 150 }
  },

  // ========== BODY (8 conquistas) ==========
  {
    id: 'weight_1',
    name: 'Na Balança',
    description: 'Registre seu peso pela primeira vez',
    icon: '⚖️',
    category: 'body',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'weight_logged', value: 1 }
  },
  {
    id: 'weight_30',
    name: 'Monitoramento Constante',
    description: 'Registre seu peso 30 vezes',
    icon: '📊',
    category: 'body',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'weight_logged', value: 30 }
  },
  {
    id: 'bio_1',
    name: 'Primeiro Scan',
    description: 'Registre sua primeira bioimpedância',
    icon: '📡',
    category: 'body',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'bioimpedance_logged', value: 1 }
  },
  {
    id: 'bio_12',
    name: 'Ano de Dados',
    description: 'Registre bioimpedância 12 vezes',
    icon: '📈',
    category: 'body',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'bioimpedance_logged', value: 12 }
  },
  {
    id: 'photo_1',
    name: 'Primeira Foto',
    description: 'Tire sua primeira foto de progresso',
    icon: '📷',
    category: 'body',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'progress_photos', value: 1 }
  },
  {
    id: 'photo_12',
    name: 'Documentarista',
    description: 'Tire 12 fotos de progresso',
    icon: '🎬',
    category: 'body',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'progress_photos', value: 12 }
  },
  {
    id: 'muscle_gained',
    name: 'Ganho de Massa',
    description: 'Ganhe 2kg de massa muscular',
    icon: '💪',
    category: 'body',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'muscle_gained', value: 2 }
  },
  {
    id: 'fat_lost',
    name: 'Definição',
    description: 'Perca 3% de gordura corporal',
    icon: '🔥',
    category: 'body',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'fat_lost', value: 3 }
  },

  // ========== CONSISTENCY (7 conquistas) ==========
  {
    id: 'checkin_1',
    name: 'Primeiro Check-in',
    description: 'Faça seu primeiro check-in diário',
    icon: '✨',
    category: 'consistency',
    tier: 'bronze',
    xpReward: TIER_XP.bronze,
    criteria: { type: 'checkins', value: 1 }
  },
  {
    id: 'checkin_30',
    name: 'Hábito Formado',
    description: 'Faça 30 check-ins diários',
    icon: '🌟',
    category: 'consistency',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'checkins', value: 30 }
  },
  {
    id: 'checkin_100',
    name: 'Consistência',
    description: 'Faça 100 check-ins diários',
    icon: '💫',
    category: 'consistency',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'checkins', value: 100 }
  },
  {
    id: 'perfect_day_1',
    name: 'Dia Perfeito',
    description: 'Alcance pontuação 100 em um dia',
    icon: '💯',
    category: 'consistency',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'perfect_days', value: 1 }
  },
  {
    id: 'perfect_day_7',
    name: 'Semana Perfeita',
    description: 'Tenha 7 dias perfeitos',
    icon: '🌈',
    category: 'consistency',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'perfect_days', value: 7 }
  },
  {
    id: 'perfect_streak_3',
    name: 'Tripla Perfeição',
    description: '3 dias perfeitos consecutivos',
    icon: '⭐',
    category: 'consistency',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'perfect_day_streak', value: 3 }
  },
  {
    id: 'perfect_streak_7',
    name: 'Semana Invicta',
    description: '7 dias perfeitos consecutivos',
    icon: '👑',
    category: 'consistency',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'perfect_day_streak', value: 7 }
  },

  // ========== SPECIAL (5 conquistas) ==========
  {
    id: 'revolade_7',
    name: 'Revolade Certeiro',
    description: 'Tome Revolade no horário por 7 dias seguidos',
    icon: '💊',
    category: 'special',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'revolade_streak', value: 7 }
  },
  {
    id: 'revolade_30',
    name: 'Mestre do Horário',
    description: 'Tome Revolade no horário por 30 dias seguidos',
    icon: '⏰',
    category: 'special',
    tier: 'gold',
    xpReward: TIER_XP.gold,
    criteria: { type: 'revolade_streak', value: 30 }
  },
  {
    id: 'level_5',
    name: 'Guerreiro',
    description: 'Alcance o nível 5',
    icon: '⚔️',
    category: 'special',
    tier: 'silver',
    xpReward: TIER_XP.silver,
    criteria: { type: 'level', value: 5 }
  },
  {
    id: 'level_10',
    name: 'Imortal',
    description: 'Alcance o nível máximo',
    icon: '🔱',
    category: 'special',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'level', value: 10 }
  },
  {
    id: 'all_achievements',
    name: 'Completista',
    description: 'Desbloqueie todas as outras conquistas',
    icon: '🎮',
    category: 'special',
    tier: 'diamond',
    xpReward: TIER_XP.diamond,
    criteria: { type: 'all_achievements' },
    secret: true
  }
]

/**
 * Obtém conquistas por categoria
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}

/**
 * Obtém conquistas por tier
 */
export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier)
}

/**
 * Obtém uma conquista pelo ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

/**
 * Obtém conquistas não-secretas
 */
export function getVisibleAchievements(): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.secret)
}

/**
 * Verifica quais conquistas foram desbloqueadas baseado nas stats
 */
export function checkUnlockedAchievements(
  stats: UserStats,
  currentLevel: number,
  currentStreak: number,
  unlockedIds: string[]
): Achievement[] {
  const newlyUnlocked: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    // Pula se já desbloqueada
    if (unlockedIds.includes(achievement.id)) continue

    // Pula conquistas secretas (verificadas separadamente)
    if (achievement.secret) continue

    const { criteria } = achievement
    let unlocked = false

    switch (criteria.type) {
      case 'streak':
        unlocked = currentStreak >= (criteria.value || 0)
        break

      case 'workouts_completed':
        unlocked = stats.workoutsCompleted >= (criteria.value || 0)
        break

      case 'personal_records':
        unlocked = stats.prsAchieved >= (criteria.value || 0)
        break

      case 'early_workouts':
        unlocked = stats.earlyWorkouts >= (criteria.value || 0)
        break

      case 'meals_logged':
        unlocked = stats.mealsLogged >= (criteria.value || 0)
        break

      case 'ai_analyses':
        unlocked = stats.aiAnalyses >= (criteria.value || 0)
        break

      case 'protein_streak':
        unlocked = stats.proteinStreakDays >= (criteria.value || 0)
        break

      case 'water_goals_met':
        unlocked = stats.waterGoalsMet >= (criteria.value || 0)
        break

      case 'water_streak':
        unlocked = stats.waterStreakDays >= (criteria.value || 0)
        break

      case 'total_water':
        unlocked = stats.totalWaterLiters >= (criteria.value || 0)
        break

      case 'weight_logged':
        // Usando checkins como proxy temporário
        break

      case 'bioimpedance_logged':
        unlocked = stats.bioimpedances >= (criteria.value || 0)
        break

      case 'progress_photos':
        unlocked = stats.progressPhotos >= (criteria.value || 0)
        break

      case 'muscle_gained':
        unlocked = stats.muscleGained >= (criteria.value || 0)
        break

      case 'fat_lost':
        unlocked = stats.fatLost >= (criteria.value || 0)
        break

      case 'checkins':
        unlocked = stats.checkins >= (criteria.value || 0)
        break

      case 'perfect_days':
        unlocked = stats.perfectDays >= (criteria.value || 0)
        break

      case 'perfect_day_streak':
        unlocked = stats.perfectDayStreak >= (criteria.value || 0)
        break

      case 'revolade_streak':
        unlocked = stats.revoladeStreak >= (criteria.value || 0)
        break

      case 'level':
        unlocked = currentLevel >= (criteria.value || 0)
        break
    }

    if (unlocked) {
      newlyUnlocked.push(achievement)
    }
  }

  return newlyUnlocked
}

/**
 * Calcula progresso para uma conquista específica
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: UserStats,
  currentLevel: number,
  currentStreak: number
): { current: number; target: number; percentage: number } {
  const { criteria } = achievement
  let current = 0
  const target = criteria.value || 0

  switch (criteria.type) {
    case 'streak':
      current = currentStreak
      break
    case 'workouts_completed':
      current = stats.workoutsCompleted
      break
    case 'personal_records':
      current = stats.prsAchieved
      break
    case 'early_workouts':
      current = stats.earlyWorkouts
      break
    case 'meals_logged':
      current = stats.mealsLogged
      break
    case 'ai_analyses':
      current = stats.aiAnalyses
      break
    case 'protein_streak':
      current = stats.proteinStreakDays
      break
    case 'water_goals_met':
      current = stats.waterGoalsMet
      break
    case 'water_streak':
      current = stats.waterStreakDays
      break
    case 'total_water':
      current = stats.totalWaterLiters
      break
    case 'bioimpedance_logged':
      current = stats.bioimpedances
      break
    case 'progress_photos':
      current = stats.progressPhotos
      break
    case 'muscle_gained':
      current = stats.muscleGained
      break
    case 'fat_lost':
      current = stats.fatLost
      break
    case 'checkins':
      current = stats.checkins
      break
    case 'perfect_days':
      current = stats.perfectDays
      break
    case 'perfect_day_streak':
      current = stats.perfectDayStreak
      break
    case 'revolade_streak':
      current = stats.revoladeStreak
      break
    case 'level':
      current = currentLevel
      break
  }

  const percentage = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0

  return { current, target, percentage }
}

/**
 * Conta conquistas por categoria
 */
export function countAchievementsByCategory(): Record<AchievementCategory, number> {
  const counts: Record<AchievementCategory, number> = {
    streak: 0,
    workout: 0,
    nutrition: 0,
    hydration: 0,
    body: 0,
    consistency: 0,
    special: 0
  }

  for (const achievement of ACHIEVEMENTS) {
    counts[achievement.category]++
  }

  return counts
}

/**
 * Obtém próxima conquista mais próxima de ser desbloqueada
 */
export function getNextAchievement(
  stats: UserStats,
  currentLevel: number,
  currentStreak: number,
  unlockedIds: string[]
): { achievement: Achievement; progress: number } | null {
  let closest: { achievement: Achievement; progress: number } | null = null
  let highestProgress = 0

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue
    if (achievement.secret) continue

    const { percentage } = getAchievementProgress(achievement, stats, currentLevel, currentStreak)

    if (percentage > highestProgress && percentage < 100) {
      highestProgress = percentage
      closest = { achievement, progress: percentage }
    }
  }

  return closest
}

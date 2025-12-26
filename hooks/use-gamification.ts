"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayISO } from '@/lib/utils/date'
import type {
  Level,
  Achievement,
  UserAchievement,
  StreakData,
  DailyScoreBreakdown,
  ActiveChallenge,
  UseGamificationReturn,
  XPEventType,
  UserStats
} from '@/types/gamification'
import {
  LEVELS,
  getLevelFromXP,
  getXPToNextLevel,
  getLevelProgress,
  checkLevelUp,
  ACHIEVEMENTS,
  checkUnlockedAchievements,
  getInitialStreakData,
  updateStreakData,
  getTodayString,
  isComeback,
  calculateStreakBonus,
  generateDailyChallenges,
  generateWeeklyChallenges
} from '@/lib/gamification'

// XP values for different activities
const XP_VALUES = {
  workout_completed: 100,
  water_goal_met: 25,
  meal_logged: 15,
  sleep_logged: 20,
  perfect_day: 50,
  pr_achieved: 75,
  streak_bonus_per_day: 5
}

// Estado inicial
const INITIAL_STATE = {
  totalXP: 0,
  currentLevel: LEVELS[0],
  xpToNextLevel: LEVELS[0].maxXP + 1,
  levelProgress: 0,
  streak: getInitialStreakData(),
  achievements: ACHIEVEMENTS,
  unlockedAchievements: [],
  todayScore: null,
  weeklyAverage: 0,
  activeChallenges: [],
  loading: true,
  showLevelUp: false,
  newLevel: null,
  showAchievement: null
}

/**
 * Hook principal de gamificação - agora com dados reais do Supabase
 */
export function useGamification(): UseGamificationReturn {
  // Estados
  const [totalXP, setTotalXP] = useState(INITIAL_STATE.totalXP)
  const [currentLevel, setCurrentLevel] = useState<Level>(INITIAL_STATE.currentLevel)
  const [xpToNextLevel, setXpToNextLevel] = useState(INITIAL_STATE.xpToNextLevel)
  const [levelProgress, setLevelProgress] = useState(INITIAL_STATE.levelProgress)
  const [streak, setStreak] = useState<StreakData>(INITIAL_STATE.streak)
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([])
  const [todayScore, setTodayScore] = useState<DailyScoreBreakdown | null>(null)
  const [weeklyAverage, setWeeklyAverage] = useState(0)
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState<Level | null>(null)
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)

  // Calcular XP baseado em atividades reais do banco
  const calculateXPFromDatabase = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('Gamification: No user found')
        return { xp: 0, stats: null, streakData: getInitialStreakData() }
      }

      const today = getTodayISO()

      // Buscar dados do perfil (streak)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('fitness_profiles')
        .select('streak_atual, maior_streak, pontos_totais')
        .eq('id', user.id)
        .single()

      // Buscar treinos concluídos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: workoutsCompleted } = await (supabase as any)
        .from('fitness_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'concluido')

      // Buscar PRs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: prsAchieved } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select('*', { count: 'exact', head: true })
        .eq('is_pr', true)

      // Buscar dias com meta de água atingida (água >= 2500ml)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waterDays } = await (supabase as any)
        .from('fitness_water_logs')
        .select('data, quantidade_ml')
        .eq('user_id', user.id)

      // Agrupar por dia e contar dias que atingiram a meta
      const waterByDay: { [key: string]: number } = {}
      if (waterDays) {
        for (const log of waterDays) {
          waterByDay[log.data] = (waterByDay[log.data] || 0) + (log.quantidade_ml || 0)
        }
      }
      const waterGoalsMet = Object.values(waterByDay).filter(ml => ml >= 2500).length

      // Buscar refeições registradas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: mealsLogged } = await (supabase as any)
        .from('fitness_meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Buscar registros de sono
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: sleepLogs } = await (supabase as any)
        .from('fitness_sleep_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calcular XP total
      const calculatedXP =
        (workoutsCompleted || 0) * XP_VALUES.workout_completed +
        (waterGoalsMet || 0) * XP_VALUES.water_goal_met +
        (mealsLogged || 0) * XP_VALUES.meal_logged +
        (sleepLogs || 0) * XP_VALUES.sleep_logged +
        (prsAchieved || 0) * XP_VALUES.pr_achieved +
        ((profile?.streak_atual || 0) * XP_VALUES.streak_bonus_per_day)

      console.log('Gamification XP calculation:', {
        workoutsCompleted,
        waterGoalsMet,
        mealsLogged,
        sleepLogs,
        prsAchieved,
        streak: profile?.streak_atual,
        totalXP: calculatedXP
      })

      // Calcular score de hoje
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayWorkout } = await (supabase as any)
        .from('fitness_workouts')
        .select('status')
        .eq('user_id', user.id)
        .eq('data', today)
        .eq('status', 'concluido')
        .maybeSingle()

      const todayWater = waterByDay[today] || 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: todayMealsCount } = await (supabase as any)
        .from('fitness_meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('data', today)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todaySleep } = await (supabase as any)
        .from('fitness_sleep_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', today)
        .maybeSingle()

      // Score do dia (0-100)
      const workoutScore = todayWorkout ? 30 : 0
      const waterScore = Math.min(30, Math.round((todayWater / 3000) * 30))
      const mealsScore = Math.min(25, (todayMealsCount || 0) * 5) // 5 pontos por refeição, max 25
      const sleepScore = todaySleep ? 15 : 0

      const dailyScore: DailyScoreBreakdown = {
        total: workoutScore + waterScore + mealsScore + sleepScore,
        workout: workoutScore,
        nutrition: mealsScore,
        hydration: waterScore,
        extras: sleepScore // sleep + outros extras
      }

      // Streak data
      const streakData: StreakData = {
        currentStreak: profile?.streak_atual || 0,
        bestStreak: profile?.maior_streak || 0,
        lastActivityDate: today,
        streakHistory: []
      }

      return {
        xp: calculatedXP,
        stats: {
          workoutsCompleted: workoutsCompleted || 0,
          prsAchieved: prsAchieved || 0,
          waterGoalsMet: waterGoalsMet || 0,
          mealsLogged: mealsLogged || 0,
          sleepLogs: sleepLogs || 0
        },
        streakData,
        dailyScore
      }
    } catch (error) {
      console.error('Erro ao calcular XP:', error)
      return { xp: 0, stats: null, streakData: getInitialStreakData(), dailyScore: null }
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    loadGamificationData()
  }, [])

  // Carregar dados do banco de dados
  const loadGamificationData = useCallback(async () => {
    setLoading(true)
    try {
      const { xp, stats, streakData, dailyScore } = await calculateXPFromDatabase()

      setTotalXP(xp)
      setCurrentLevel(getLevelFromXP(xp))
      setXpToNextLevel(getXPToNextLevel(xp))
      setLevelProgress(getLevelProgress(xp))
      setStreak(streakData)

      if (dailyScore) {
        setTodayScore(dailyScore)
      }

      // Carregar desafios do localStorage (por enquanto)
      const savedData = localStorage.getItem('felicefit_gamification')
      if (savedData) {
        const data = JSON.parse(savedData)
        setUnlockedAchievements(data.unlockedAchievements || [])
        setActiveChallenges(data.activeChallenges || [])
      } else {
        // Inicializar com desafios
        const dailyChallenges = generateDailyChallenges()
        const weeklyChallenges = generateWeeklyChallenges()
        setActiveChallenges([...dailyChallenges, ...weeklyChallenges])
      }

      console.log('Gamification loaded:', { xp, level: getLevelFromXP(xp).level, progress: getLevelProgress(xp) })
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error)
    } finally {
      setLoading(false)
    }
  }, [calculateXPFromDatabase])

  // Salvar dados de conquistas no localStorage
  const saveGamificationData = useCallback(() => {
    const data = {
      unlockedAchievements,
      activeChallenges,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('felicefit_gamification', JSON.stringify(data))
  }, [unlockedAchievements, activeChallenges])

  // Auto-save quando dados de conquistas mudam
  useEffect(() => {
    if (!loading) {
      saveGamificationData()
    }
  }, [unlockedAchievements, activeChallenges, loading, saveGamificationData])

  // Adicionar XP (para ações manuais, o cálculo principal vem do banco)
  const addXP = useCallback(async (amount: number, reason: string, type?: XPEventType) => {
    const previousXP = totalXP
    const newTotalXP = previousXP + amount

    setTotalXP(newTotalXP)

    // Verificar level up
    const levelUp = checkLevelUp(previousXP, newTotalXP)
    if (levelUp) {
      setNewLevel(levelUp)
      setShowLevelUp(true)
    }

    // Atualizar level info
    setCurrentLevel(getLevelFromXP(newTotalXP))
    setXpToNextLevel(getXPToNextLevel(newTotalXP))
    setLevelProgress(getLevelProgress(newTotalXP))

    console.log(`+${amount} XP: ${reason}`)
  }, [totalXP])

  // Verificar conquistas
  const checkAchievements = useCallback(async (): Promise<Achievement[]> => {
    // Montar stats baseado nos dados atuais
    const stats: UserStats = {
      workoutsCompleted: 0,
      totalSets: 0,
      totalReps: 0,
      prsAchieved: 0,
      earlyWorkouts: 0,
      mealsLogged: 0,
      aiAnalyses: 0,
      proteinStreakDays: 0,
      perfectMacroDays: 0,
      waterGoalsMet: 0,
      waterStreakDays: 0,
      totalWaterLiters: 0,
      bioimpedances: 0,
      progressPhotos: 0,
      muscleGained: 0,
      fatLost: 0,
      perfectDays: 0,
      perfectDayStreak: 0,
      checkins: 0,
      revoladeStreak: 0
    }

    const unlockedIds = unlockedAchievements.map(a => a.achievementId)
    const newlyUnlocked = checkUnlockedAchievements(
      stats,
      currentLevel.level,
      streak.currentStreak,
      unlockedIds
    )

    if (newlyUnlocked.length > 0) {
      // Adicionar às conquistas desbloqueadas
      const newUserAchievements: UserAchievement[] = newlyUnlocked.map(a => ({
        id: `${a.id}_${Date.now()}`,
        achievementId: a.id,
        unlockedAt: new Date()
      }))

      setUnlockedAchievements(prev => [...prev, ...newUserAchievements])

      // Mostrar primeira conquista nova
      setShowAchievement(newlyUnlocked[0])

      // Adicionar XP das conquistas
      for (const achievement of newlyUnlocked) {
        await addXP(achievement.xpReward, `Conquista: ${achievement.name}`, 'achievement_unlocked')
      }
    }

    return newlyUnlocked
  }, [unlockedAchievements, currentLevel.level, streak.currentStreak, addXP])

  // Refresh
  const refreshGamification = useCallback(async () => {
    await loadGamificationData()
    await checkAchievements()
  }, [loadGamificationData, checkAchievements])

  // Dismiss level up
  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false)
    setNewLevel(null)
  }, [])

  // Dismiss achievement
  const dismissAchievement = useCallback(() => {
    setShowAchievement(null)
  }, [])

  return {
    // XP e Nível
    totalXP,
    currentLevel,
    xpToNextLevel,
    levelProgress,

    // Streak
    streak,

    // Conquistas
    achievements: ACHIEVEMENTS,
    unlockedAchievements,

    // Pontuação
    todayScore,
    weeklyAverage,

    // Desafios
    activeChallenges,

    // Ações
    checkAchievements,
    addXP,
    refreshGamification,

    // Estados
    loading,
    showLevelUp,
    newLevel,
    showAchievement,

    // Dismisses
    dismissLevelUp,
    dismissAchievement
  }
}

export default useGamification

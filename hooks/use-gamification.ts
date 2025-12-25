"use client"

import { useState, useEffect, useCallback } from 'react'
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
 * Hook principal de gamificação
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

  // Carregar dados iniciais
  useEffect(() => {
    loadGamificationData()
  }, [])

  // Carregar dados do servidor/localStorage
  const loadGamificationData = useCallback(async () => {
    setLoading(true)
    try {
      // Por enquanto usando localStorage, depois migrar para Supabase
      const savedData = localStorage.getItem('felicefit_gamification')

      if (savedData) {
        const data = JSON.parse(savedData)
        setTotalXP(data.totalXP || 0)
        setStreak(data.streak || getInitialStreakData())
        setUnlockedAchievements(data.unlockedAchievements || [])
        setActiveChallenges(data.activeChallenges || [])
        setTodayScore(data.todayScore || null)
        setWeeklyAverage(data.weeklyAverage || 0)

        // Recalcular level info
        const xp = data.totalXP || 0
        setCurrentLevel(getLevelFromXP(xp))
        setXpToNextLevel(getXPToNextLevel(xp))
        setLevelProgress(getLevelProgress(xp))
      } else {
        // Inicializar com desafios
        const dailyChallenges = generateDailyChallenges()
        const weeklyChallenges = generateWeeklyChallenges()
        setActiveChallenges([...dailyChallenges, ...weeklyChallenges])
      }
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Salvar dados
  const saveGamificationData = useCallback(() => {
    const data = {
      totalXP,
      streak,
      unlockedAchievements,
      activeChallenges,
      todayScore,
      weeklyAverage,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('felicefit_gamification', JSON.stringify(data))
  }, [totalXP, streak, unlockedAchievements, activeChallenges, todayScore, weeklyAverage])

  // Auto-save quando dados mudam
  useEffect(() => {
    if (!loading) {
      saveGamificationData()
    }
  }, [totalXP, streak, unlockedAchievements, activeChallenges, todayScore, weeklyAverage, loading, saveGamificationData])

  // Adicionar XP
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

    // Atualizar streak se for atividade do dia
    if (type && type !== 'level_up' && type !== 'achievement_unlocked') {
      const today = getTodayString()

      // Verificar comeback
      if (isComeback(streak.lastActivityDate)) {
        // Adicionar XP de comeback
        const comebackXP = 50
        setTotalXP(prev => prev + comebackXP)
      }

      const updatedStreak = updateStreakData(streak, today, [type])
      setStreak(updatedStreak)

      // Adicionar bônus de streak
      const streakBonus = calculateStreakBonus(updatedStreak.currentStreak)
      if (streakBonus > 0) {
        setTotalXP(prev => prev + streakBonus)
      }
    }

    console.log(`+${amount} XP: ${reason}`)
  }, [totalXP, streak])

  // Verificar conquistas
  const checkAchievements = useCallback(async (): Promise<Achievement[]> => {
    // Montar stats baseado nos dados atuais
    // Por enquanto usando dados mockados, depois integrar com dados reais
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

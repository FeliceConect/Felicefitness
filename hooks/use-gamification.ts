"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
  generateDailyChallenges,
  generateWeeklyChallenges
} from '@/lib/gamification'
import {
  getUserAchievementCodes,
  unlockAchievementByCode,
  applyStreakFreezes,
} from '@/lib/services/achievements'
import type { FreezeInfo } from '@/lib/services/achievements'
import { computeChallengeProgress } from '@/lib/gamification/challenge-progress'
import type { ChallengeProgressContext } from '@/lib/gamification/challenge-progress'
import { getDateOffsetSP } from '@/lib/utils/date'

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
 * Hook principal de gamificação
 * - XP e streak calculados do Supabase
 * - Conquistas persistidas no Supabase (fitness_achievements_users)
 * - Streak freeze: 2 dias de graça por mês
 * - Desafios diários/semanais em localStorage (será migrado na Fase 4)
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
  const userStatsRef = useRef<UserStats | null>(null)
  const userIdRef = useRef<string | null>(null)

  // Calcular XP baseado em atividades reais do banco
  const calculateXPFromDatabase = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return { xp: 0, stats: null, streakData: getInitialStreakData(), freezeInfo: null }
      }

      userIdRef.current = user.id
      const today = getTodayISO()

      // Buscar dados do perfil (streak + freeze)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('fitness_profiles')
        .select('streak_atual, maior_streak, pontos_totais, streak_freeze_used, streak_freeze_month, streak_last_activity_date, meta_agua_ml, meta_proteina_g, meta_calorias_diarias')
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
        .select('*, workout_exercise:fitness_workout_exercises!inner(workout:fitness_workouts!inner(user_id))', { count: 'exact', head: true })
        .eq('is_pr', true)
        .eq('workout_exercise.workout.user_id', user.id)

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
      const waterGoalsMet = Object.values(waterByDay).filter(ml => ml >= 2000).length

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

      // Buscar bioimpedâncias
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: bioimpedances } = await (supabase as any)
        .from('fitness_body_compositions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('impedancia_dados', 'is', null)

      // Buscar fotos de progresso
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: progressPhotos } = await (supabase as any)
        .from('fitness_progress_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calcular total de água em litros
      const totalWaterMl = Object.values(waterByDay).reduce((sum: number, ml: number) => sum + ml, 0)
      const totalWaterLiters = Math.round(totalWaterMl / 1000)

      // Calcular XP total
      const calculatedXP =
        (workoutsCompleted || 0) * XP_VALUES.workout_completed +
        (waterGoalsMet || 0) * XP_VALUES.water_goal_met +
        (mealsLogged || 0) * XP_VALUES.meal_logged +
        (sleepLogs || 0) * XP_VALUES.sleep_logged +
        (prsAchieved || 0) * XP_VALUES.pr_achieved +
        ((profile?.streak_atual || 0) * XP_VALUES.streak_bonus_per_day)

      // Calcular score de hoje
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayWorkout } = await (supabase as any)
        .from('fitness_workouts')
        .select('status')
        .eq('user_id', user.id)
        .eq('data', today)
        .eq('status', 'concluido')
        .maybeSingle()

      // Atividade qualificada hoje (≥20min, intensidade ≥ moderada) também
      // conta como treino — alinhado com a regra do streak.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: qualifyingActivityCount } = await (supabase as any)
        .from('fitness_activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('date', today)
        .gte('duration_minutes', 20)
        .in('intensity', ['moderado', 'intenso', 'muito_intenso'])

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

      // Buscar data do último treino (para freeze check)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lastWorkout } = await (supabase as any)
        .from('fitness_workouts')
        .select('data')
        .eq('user_id', user.id)
        .eq('status', 'concluido')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Score do dia (0-100) — pesos batem com SCORE_WEIGHTS exibidos:
      // workout=30, nutrition=30, hydration=25, extras=15
      const hasWorkoutOrActivity = !!todayWorkout || (qualifyingActivityCount ?? 0) > 0
      const workoutScore = hasWorkoutOrActivity ? 30 : 0

      // Hidratação: relativo à meta do perfil (não 3000ml fixo)
      const waterGoalMl = profile?.meta_agua_ml ?? 2000
      const waterScore = waterGoalMl > 0
        ? Math.min(25, Math.round((todayWater / waterGoalMl) * 25))
        : 0

      // Nutrição: 6 pts por refeição, max 30 (= 5 refeições atinge o teto)
      const mealsScore = Math.min(30, (todayMealsCount || 0) * 6)

      const sleepScore = todaySleep ? 15 : 0

      const dailyScore: DailyScoreBreakdown = {
        total: workoutScore + waterScore + mealsScore + sleepScore,
        workout: workoutScore,
        nutrition: mealsScore,
        hydration: waterScore,
        extras: sleepScore
      }

      // ─── Dados adicionais para progress de DESAFIOS ─────────────────
      // Refeições do dia com macros (pra critérios protein_meal/protein_goal)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayMealsRows } = await (supabase as any)
        .from('fitness_meals')
        .select('tipo_refeicao, proteinas_total, calorias_total, horario')
        .eq('user_id', user.id)
        .eq('data', today)
      const todayMealsArr = (todayMealsRows || []) as Array<{
        tipo_refeicao: string
        proteinas_total: number
        calorias_total: number
        horario?: string
      }>
      const todayProteinG = todayMealsArr.reduce((s, m) => s + (m.proteinas_total || 0), 0)
      const todayCaloriesKcal = todayMealsArr.reduce((s, m) => s + (m.calorias_total || 0), 0)

      // Hora do treino concluído de hoje (pra early_workout)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: todayWorkoutFull } = await (supabase as any)
        .from('fitness_workouts')
        .select('horario_inicio, horario_fim')
        .eq('user_id', user.id)
        .eq('data', today)
        .eq('status', 'concluido')
        .maybeSingle()
      const todayWorkoutTime = todayWorkoutFull?.horario_inicio
        ? String(todayWorkoutFull.horario_inicio).slice(0, 5)
        : undefined

      // PRs de hoje
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: todayPRsCount } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select('*, workout_exercise:fitness_workout_exercises!inner(workout:fitness_workouts!inner(user_id, data))', { count: 'exact', head: true })
        .eq('is_pr', true)
        .eq('workout_exercise.workout.user_id', user.id)
        .eq('workout_exercise.workout.data', today)

      // Treinos completos da semana (segunda a domingo SP)
      const weekAgoStr = getDateOffsetSP(-6)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: weeklyWorkoutsCompleted } = await (supabase as any)
        .from('fitness_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'concluido')
        .gte('data', weekAgoStr)
        .lte('data', today)

      // PRs da semana
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: weeklyPRsCount } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select('*, workout_exercise:fitness_workout_exercises!inner(workout:fitness_workouts!inner(user_id, data))', { count: 'exact', head: true })
        .eq('is_pr', true)
        .eq('workout_exercise.workout.user_id', user.id)
        .gte('workout_exercise.workout.data', weekAgoStr)
        .lte('workout_exercise.workout.data', today)

      // Metas de proteína/calorias do perfil — fallback se nutri não definiu
      const proteinGoalG = (profile as { meta_proteina_g?: number })?.meta_proteina_g ?? 130
      const caloriesGoalKcal = (profile as { meta_calorias_diarias?: number })?.meta_calorias_diarias ?? 2000

      // Contexto pra calcular progresso dos desafios ativos
      const challengeCtx: ChallengeProgressContext = {
        todayMealsCount: todayMealsCount || 0,
        todayMeals: todayMealsArr.map(m => ({
          tipo_refeicao: m.tipo_refeicao,
          proteinas_total: m.proteinas_total || 0,
          calorias_total: m.calorias_total || 0,
        })),
        plannedMealsCount: 5,
        todayWaterMl: todayWater,
        waterGoalMl,
        todayProteinG,
        proteinGoalG,
        todayCaloriesKcal,
        caloriesGoalKcal,
        todayWorkoutCompleted: !!todayWorkout || (qualifyingActivityCount ?? 0) > 0,
        todayWorkoutFull: !!todayWorkout,
        todayWorkoutTime,
        todayPRsCount: todayPRsCount || 0,
        todayScoreTotal: workoutScore + waterScore + mealsScore + sleepScore,
        weeklyWorkoutsCompleted: weeklyWorkoutsCompleted || 0,
        weeklyPRsCount: weeklyPRsCount || 0,
        currentStreak: profile?.streak_atual || 0,
      }

      // Streak data
      const streakData: StreakData = {
        currentStreak: profile?.streak_atual || 0,
        bestStreak: profile?.maior_streak || 0,
        lastActivityDate: today,
        streakHistory: [],
        freezesAvailable: 2,
        freezesUsed: 0,
      }

      // Freeze info for the freeze check
      const freezeInfo: FreezeInfo = {
        freezeUsed: profile?.streak_freeze_used || 0,
        freezeMonth: profile?.streak_freeze_month || null,
        lastActivityDate: profile?.streak_last_activity_date || lastWorkout?.data || null,
      }

      // Build full UserStats
      const fullStats: UserStats = {
        workoutsCompleted: workoutsCompleted || 0,
        totalSets: 0,
        totalReps: 0,
        prsAchieved: prsAchieved || 0,
        earlyWorkouts: 0,
        mealsLogged: mealsLogged || 0,
        proteinStreakDays: 0,
        perfectMacroDays: 0,
        waterGoalsMet: waterGoalsMet || 0,
        waterStreakDays: 0,
        totalWaterLiters,
        bioimpedances: bioimpedances || 0,
        progressPhotos: progressPhotos || 0,
        muscleGained: 0,
        fatLost: 0,
        perfectDays: 0,
        perfectDayStreak: 0,
        checkins: sleepLogs || 0,
        medicamentoStreak: 0
      }

      return {
        xp: calculatedXP,
        stats: fullStats,
        streakData,
        dailyScore,
        freezeInfo,
        challengeCtx,
      }
    } catch (error) {
      console.error('Erro ao calcular XP:', error)
      return { xp: 0, stats: null, streakData: getInitialStreakData(), dailyScore: null, freezeInfo: null, challengeCtx: null }
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
      const { xp, stats, streakData, dailyScore, freezeInfo, challengeCtx } = await calculateXPFromDatabase()

      setTotalXP(xp)
      setCurrentLevel(getLevelFromXP(xp))
      setXpToNextLevel(getXPToNextLevel(xp))
      setLevelProgress(getLevelProgress(xp))

      // Save real stats for achievement checking
      if (stats) {
        userStatsRef.current = stats
      }

      if (dailyScore) {
        setTodayScore(dailyScore)
      }

      // --- Load achievements from Supabase ---
      const dbAchievementCodes = await getUserAchievementCodes()
      const dbUnlockedIds = dbAchievementCodes.map(a => a.code)
      if (dbAchievementCodes.length > 0) {
        const userAchievements: UserAchievement[] = dbAchievementCodes.map(a => ({
          id: a.code,
          achievementId: a.code,
          unlockedAt: a.unlockedAt,
        }))
        setUnlockedAchievements(userAchievements)
      }

      // --- Check and apply streak freezes ---
      let finalStreak = streakData
      if (freezeInfo && userIdRef.current) {
        const freezeResult = await applyStreakFreezes(
          userIdRef.current,
          streakData.currentStreak,
          freezeInfo
        )

        const updatedStreak: StreakData = {
          ...streakData,
          currentStreak: freezeResult.newStreak ?? streakData.currentStreak,
          freezesAvailable: freezeResult.freezesAvailable,
          freezesUsed: freezeResult.freezesUsed,
        }

        // If streak was recalculated, update best streak too
        if (freezeResult.newStreak !== null) {
          updatedStreak.bestStreak = Math.max(
            updatedStreak.bestStreak,
            updatedStreak.currentStreak
          )
        }

        setStreak(updatedStreak)
        finalStreak = updatedStreak
      } else {
        setStreak(streakData)
      }

      // --- Auto-check achievements: desbloqueia o que estiver pendente
      // sem esperar uma ação do usuário (ex: streak=7 desbloqueia
      // "Primeira Faísca" e "Semana de Fogo" na hora). ---
      if (stats) {
        const newlyUnlocked = checkUnlockedAchievements(
          stats,
          getLevelFromXP(xp).level,
          finalStreak.currentStreak,
          dbUnlockedIds
        )
        if (newlyUnlocked.length > 0) {
          const newUserAchievements: UserAchievement[] = newlyUnlocked.map(a => ({
            id: a.id,
            achievementId: a.id,
            unlockedAt: new Date(),
          }))
          setUnlockedAchievements(prev => [...prev, ...newUserAchievements])
          // Persiste no banco (best-effort, não bloqueia UI se uma falhar)
          for (const ach of newlyUnlocked) {
            try {
              await unlockAchievementByCode(ach.id)
            } catch (err) {
              console.error('Erro ao salvar conquista:', ach.id, err)
            }
          }
          // Mostra modal só da primeira (pra não spammar)
          setShowAchievement(newlyUnlocked[0])
        }
      }

      // Active challenges em localStorage. Regenera diários quando vira o
      // dia e semanais quando vira a semana, em vez de deixar "Expirado".
      const now = new Date()
      const savedData = localStorage.getItem('felicefit_gamification')
      let activeChallengesToSet: ActiveChallenge[] = []
      if (savedData) {
        const data = JSON.parse(savedData)
        const saved: ActiveChallenge[] = (data.activeChallenges || []).map((c: ActiveChallenge & { expiresAt?: string | Date }) => ({
          ...c,
          expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined,
        }))

        // Mantém apenas os ainda válidos
        const validDaily = saved.filter(c => c.type === 'daily' && c.expiresAt && c.expiresAt > now)
        const validWeekly = saved.filter(c => c.type === 'weekly' && c.expiresAt && c.expiresAt > now)
        const others = saved.filter(c => c.type !== 'daily' && c.type !== 'weekly')

        // Regenera o que expirou
        const dailyChallenges = validDaily.length > 0 ? validDaily : generateDailyChallenges()
        const weeklyChallenges = validWeekly.length > 0 ? validWeekly : generateWeeklyChallenges()

        activeChallengesToSet = [...dailyChallenges, ...weeklyChallenges, ...others]
      } else {
        const dailyChallenges = generateDailyChallenges()
        const weeklyChallenges = generateWeeklyChallenges()
        activeChallengesToSet = [...dailyChallenges, ...weeklyChallenges]
      }

      // Atualiza progresso de cada desafio com dados reais do dia/semana.
      // Award XP automático quando um desafio é concluído pela primeira vez
      // (compara com o estado anterior do localStorage).
      if (challengeCtx) {
        const previouslyCompletedIds = new Set(
          (savedData ? JSON.parse(savedData).activeChallenges || [] : [])
            .filter((c: ActiveChallenge) => c.completed)
            .map((c: ActiveChallenge) => c.id)
        )
        activeChallengesToSet = activeChallengesToSet.map(c => {
          const result = computeChallengeProgress(c, challengeCtx)
          const justCompleted = result.completed && !previouslyCompletedIds.has(c.id)
          if (justCompleted) {
            // Best-effort: credita XP pelo desafio recém-concluído
            addXP(c.xpReward, `Desafio: ${c.name}`, 'challenge_completed').catch(() => {})
          }
          return { ...c, progress: result.progress, target: result.target, completed: result.completed }
        })
      }
      setActiveChallenges(activeChallengesToSet)

    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error)
    } finally {
      setLoading(false)
    }
  }, [calculateXPFromDatabase])

  // Salvar dados de desafios no localStorage (conquistas agora vão para o DB)
  const saveGamificationData = useCallback(() => {
    const data = {
      activeChallenges,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('felicefit_gamification', JSON.stringify(data))
  }, [activeChallenges])

  // Auto-save quando dados de desafios mudam
  useEffect(() => {
    if (!loading) {
      saveGamificationData()
    }
  }, [activeChallenges, loading, saveGamificationData])

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

  }, [totalXP])

  // Verificar conquistas
  const checkAchievements = useCallback(async (): Promise<Achievement[]> => {
    // Use real stats from database, fallback to zeros if not yet loaded
    const stats: UserStats = userStatsRef.current || {
      workoutsCompleted: 0,
      totalSets: 0,
      totalReps: 0,
      prsAchieved: 0,
      earlyWorkouts: 0,
      mealsLogged: 0,
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
      medicamentoStreak: 0
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
        id: a.id,
        achievementId: a.id,
        unlockedAt: new Date()
      }))

      setUnlockedAchievements(prev => [...prev, ...newUserAchievements])

      // Mostrar primeira conquista nova
      setShowAchievement(newlyUnlocked[0])

      // Salvar no Supabase
      for (const achievement of newlyUnlocked) {
        await unlockAchievementByCode(achievement.id)
      }

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

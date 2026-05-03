"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayISO } from '@/lib/utils/date'
import type { Profile } from '@/types/database'

// Chave do cache do dashboard. Mutações que afetam o dashboard
// (água, refeição, treino, sono, atividade) devem invalidar essa key
// via DASHBOARD_QUERY_KEY ou queryClient.invalidateQueries({ queryKey: ['dashboard'] }).
export const DASHBOARD_QUERY_KEY = ['dashboard'] as const

export interface TodayWorkout {
  id: string
  nome: string
  tipo: string
  fase?: string
  duracao_estimada: number
  exercicios_count: number
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_realizado?: string
  duracao_minutos?: number
}

// Tipos para programas de treino do profissional
interface TrainingProgram {
  id: string
  weeks?: TrainingWeek[]
}

interface TrainingWeek {
  id: string
  days?: TrainingDay[]
}

interface TrainingDay {
  id: string
  day_of_week: number
  name: string | null
  estimated_duration: number | null
  exercises?: TrainingExercise[]
}

interface TrainingExercise {
  id: string
}

export interface TodayMeal {
  tipo: string
  status: 'pendente' | 'concluido'
  horario?: string
  calorias?: number
}

export interface WorkoutStats {
  totalWorkouts: number
  prsThisMonth: number
}

export interface DashboardData {
  profile: Profile | null
  todayWorkout: TodayWorkout | null
  todayMeals: TodayMeal[]
  waterTotal: number
  waterGoal: number
  streak: number
  caloriesConsumed: number
  caloriesGoal: number
  proteinConsumed: number
  proteinGoal: number
  workoutStats: WorkoutStats
  sleepLoggedToday: boolean
  /** Atividade física qualificada hoje (≥20min, intensidade ≥ moderada). */
  hasQualifyingActivityToday: boolean
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

// Dados padrão para novos usuários (sem dados específicos de medicamento)
const mockProfile: Profile = {
  id: 'mock-user-id',
  nome: 'Usuário',
  email: '',
  data_nascimento: null,
  sexo: null,
  altura_cm: null,
  peso_atual: null,
  objetivo: 'saude',
  nivel_atividade: 'moderado',
  meta_calorias_diarias: 2500,
  meta_proteina_g: 170,
  meta_carboidrato_g: 280,
  meta_gordura_g: 85,
  meta_agua_ml: 2000,
  hora_acordar: '06:00',
  hora_dormir: '22:00',
  // Medicamento desativado por padrão - cada usuário configura se precisar
  usa_medicamento_jejum: false,
  medicamento_nome: null,
  medicamento_horario: null,
  medicamento_jejum_antes_horas: null,
  medicamento_restricao_depois_horas: null,
  medicamento_restricao_tipo: null,
  meta_peso: null,
  meta_percentual_gordura: null,
  meta_massa_muscular: null,
  data_meta: null,
  streak_atual: 0,
  maior_streak: 0,
  pontos_totais: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockWorkout: TodayWorkout = {
  id: 'mock-workout-id',
  nome: 'Pernas A - Força',
  tipo: 'tradicional',
  duracao_estimada: 45,
  exercicios_count: 6,
  status: 'pendente'
}

const mockMeals: TodayMeal[] = [
  { tipo: 'cafe_manha', status: 'concluido', horario: '06:30', calorias: 450 },
  { tipo: 'lanche_manha', status: 'concluido', horario: '10:00', calorias: 200 },
  { tipo: 'almoco', status: 'concluido', horario: '12:30', calorias: 650 },
  { tipo: 'lanche_tarde', status: 'pendente' },
  { tipo: 'jantar', status: 'pendente' },
  { tipo: 'ceia', status: 'pendente' }
]

interface DashboardSnapshot {
  profile: Profile | null
  todayWorkout: TodayWorkout | null
  todayMeals: TodayMeal[]
  waterTotal: number
  caloriesConsumed: number
  proteinConsumed: number
  workoutStats: WorkoutStats
  sleepLoggedToday: boolean
  hasQualifyingActivityToday: boolean
}

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  profile: null,
  todayWorkout: null,
  todayMeals: [],
  waterTotal: 0,
  caloriesConsumed: 0,
  proteinConsumed: 0,
  workoutStats: { totalWorkouts: 0, prsThisMonth: 0 },
  sleepLoggedToday: false,
  hasQualifyingActivityToday: false,
}

const MOCK_SNAPSHOT: DashboardSnapshot = {
  profile: mockProfile,
  todayWorkout: mockWorkout,
  todayMeals: mockMeals,
  waterTotal: 1800,
  caloriesConsumed: 1300,
  proteinConsumed: 95,
  workoutStats: { totalWorkouts: 0, prsThisMonth: 0 },
  sleepLoggedToday: false,
  hasQualifyingActivityToday: false,
}

async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return MOCK_SNAPSHOT
  }

  const today = getTodayISO()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // BATCH 1 — 7 queries independentes em paralelo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [
    profileResult,
    sleepResult,
    waterResult,
    workoutTodayResult,
    mealsResult,
    totalWorkoutsResult,
    prsResult,
    activitiesTodayResult,
  ] = await Promise.all([
    sb.from('fitness_profiles').select('*').eq('id', user.id).single(),
    sb.from('fitness_sleep_logs').select('id').eq('user_id', user.id).gte('created_at', todayStart.toISOString()).limit(1),
    sb.from('fitness_water_logs').select('quantidade_ml').eq('user_id', user.id).eq('data', today),
    sb.from('fitness_workouts').select('id, nome, tipo, duracao_minutos, status').eq('user_id', user.id).eq('data', today).maybeSingle(),
    sb.from('fitness_meals').select('tipo_refeicao, calorias_total, proteinas_total, horario').eq('user_id', user.id).eq('data', today),
    sb.from('fitness_workouts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'concluido'),
    sb.from('fitness_exercise_sets').select('*, workout_exercise:fitness_workout_exercises!inner(workout:fitness_workouts!inner(user_id))', { count: 'exact', head: true }).eq('is_pr', true).eq('workout_exercise.workout.user_id', user.id).gte('created_at', startOfMonth.toISOString()),
    sb.from('fitness_activities').select('id', { head: true, count: 'exact' }).eq('user_id', user.id).eq('date', today).gte('duration_minutes', 20).in('intensity', ['moderado', 'intenso', 'muito_intenso']),
  ])

  // Atividade física qualificada hoje (≥20min, intensidade ≥ moderada)
  // — equivalente a treino para o item "Treino" do daily score.
  const hasQualifyingActivityToday = (activitiesTodayResult.count ?? 0) > 0

  // Profile (com fallback para metadata do auth)
  let profile: Profile | null = null
  const { data: profileData, error: profileError } = profileResult
  if (profileData) {
    profile = profileData as Profile
  } else {
    const userName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     'Usuário'
    profile = {
      ...mockProfile,
      id: user.id,
      nome: userName,
      email: user.email || '',
    }
    if (profileError) {
      console.warn('Perfil não encontrado, usando dados do auth:', profileError.message)
    }
  }

  // Sleep hoje
  const sleepLoggedToday = Array.isArray(sleepResult.data) && sleepResult.data.length > 0

  // Água
  let waterTotal = 0
  if (waterResult.data && Array.isArray(waterResult.data)) {
    waterTotal = waterResult.data.reduce(
      (acc: number, log: { quantidade_ml: number | null }) => acc + (log.quantidade_ml || 0),
      0
    )
  }

  // Refeições de hoje + totais nutricionais
  const mealsData = mealsResult.data
  const mealTypes = ['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mealsMap = new Map(mealsData?.map((m: any) => [m.tipo_refeicao, m]) || [])
  const todayMeals: TodayMeal[] = mealTypes.map(tipo => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meal = mealsMap.get(tipo) as any
    if (meal) {
      return {
        tipo,
        status: 'concluido' as const,
        horario: meal.horario ?? undefined,
        calorias: meal.calorias_total ?? undefined,
      }
    }
    return { tipo, status: 'pendente' as const }
  })

  let caloriesConsumed = 0
  let proteinConsumed = 0
  if (mealsData && Array.isArray(mealsData)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    caloriesConsumed = mealsData.reduce((acc: number, m: any) => acc + (m.calorias_total || 0), 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proteinConsumed = mealsData.reduce((acc: number, m: any) => acc + (m.proteinas_total || 0), 0)
  }

  // Stats de treinos (count) + PRs do mês
  const workoutStats: WorkoutStats = {
    totalWorkouts: totalWorkoutsResult.count || 0,
    prsThisMonth: prsResult.count || 0,
  }

  // Treino de hoje — depende do resultado do batch 1
  let todayWorkout: TodayWorkout | null = null
  const workoutData = workoutTodayResult.data
  if (workoutData) {
    const { count: exerciseCount } = await sb
      .from('fitness_workout_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutData.id)

    todayWorkout = {
      id: workoutData.id,
      nome: workoutData.nome,
      tipo: workoutData.tipo,
      duracao_estimada: workoutData.duracao_minutos || 45,
      exercicios_count: exerciseCount || 0,
      status: (workoutData.status as TodayWorkout['status']) || 'pendente',
      duracao_minutos: workoutData.duracao_minutos ?? undefined,
    }
  } else {
        // Não há treino real para hoje - buscar programa do profissional OU template local
        const nowSP = new Date(today + 'T12:00:00-03:00')
        const dayOfWeek = nowSP.getDay()

        // PRIORIDADE 1: Buscar programa de treino do profissional
        let foundWorkout = false
        let hasProfessionalProgram = false
        try {
          const programResponse = await fetch('/api/client/training-program')
          if (programResponse.ok) {
            const programResult = await programResponse.json()
            hasProfessionalProgram = programResult.success && programResult.program !== null
            if (programResult.success && programResult.program) {
              const program = programResult.program as TrainingProgram

              // Encontrar o treino para o dia da semana atual
              if (program.weeks && program.weeks.length > 0) {
                const activeWeek = program.weeks[0]

                if (activeWeek.days) {
                  // Filtrar dias com exercícios
                  const daysWithExercises = activeWeek.days.filter(
                    (day: TrainingDay) => day.exercises && day.exercises.length > 0
                  )

                  // Usar a mesma lógica de distribuição do use-workouts.ts
                  // Primeiro, calcular o dia_semana para cada treino
                  const numDays = daysWithExercises.length
                  const dayDistribution: Record<number, number[]> = {
                    1: [1], // 1 treino: segunda
                    2: [1, 4], // 2 treinos: segunda e quinta
                    3: [1, 3, 5], // 3 treinos: segunda, quarta, sexta
                    4: [1, 2, 4, 5], // 4 treinos: seg, ter, qui, sex
                    5: [1, 2, 3, 4, 5], // 5 treinos: seg a sex
                    6: [1, 2, 3, 4, 5, 6], // 6 treinos: seg a sab
                    7: [0, 1, 2, 3, 4, 5, 6] // 7 treinos: todos os dias
                  }
                  const distribution = dayDistribution[numDays] || dayDistribution[Math.min(numDays, 7)]

                  // Mapear cada dia com seu dia_semana calculado (igual use-workouts.ts)
                  const daysWithCalculatedWeekday = daysWithExercises.map((day: TrainingDay, index: number) => ({
                    ...day,
                    calculatedDiaSemana: day.day_of_week ?? distribution[index % distribution.length]
                  }))

                  // Agora buscar pelo dia_semana calculado
                  const todayTraining = daysWithCalculatedWeekday.find(
                    day => day.calculatedDiaSemana === dayOfWeek
                  )

                  if (todayTraining) {
                    todayWorkout = {
                      id: `template-${today}-${todayTraining.id}`,
                      nome: todayTraining.name || 'Treino do dia',
                      tipo: 'tradicional',
                      fase: 'Fase Base',
                      duracao_estimada: todayTraining.estimated_duration || 45,
                      exercicios_count: todayTraining.exercises?.length || 0,
                      status: 'pendente',
                    }
                    foundWorkout = true
                  }
                }
              }
            }
          }
        } catch (programError) {
          console.error('Dashboard: Erro ao buscar programa do profissional:', programError)
        }

        if (!foundWorkout && !hasProfessionalProgram) {
          // Só busca template local se NÃO tem programa do profissional
          const { data: templateData } = await sb
            .from('fitness_workout_templates')
            .select(`
              id, nome, tipo, duracao_estimada_min,
              exercicios:fitness_workout_template_exercises(id)
            `)
            .eq('user_id', user.id)
            .eq('is_ativo', true)
            .eq('dia_semana', dayOfWeek)
            .maybeSingle()

          if (templateData) {
            todayWorkout = {
              id: `template-${today}-${templateData.id}`,
              nome: templateData.nome,
              tipo: templateData.tipo,
              duracao_estimada: templateData.duracao_estimada_min || 45,
              exercicios_count: templateData.exercicios?.length || 0,
              status: 'pendente',
            }
          }
        }
        // Se hasProfessionalProgram mas não achou treino do dia, todayWorkout fica null (correto).
      }

  return {
    profile,
    todayWorkout,
    todayMeals,
    waterTotal,
    caloriesConsumed,
    proteinConsumed,
    workoutStats,
    sleepLoggedToday,
    hasQualifyingActivityToday,
  }
}

export function useDashboardData(): DashboardData {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardSnapshot,
    // Cache curto: dashboard atualiza muito (água, refeição, treino).
    // Mutações invalidam explicitamente; staleTime evita re-fetch em
    // navegação rápida (ex: voltar de /agua para /dashboard).
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const refresh = useCallback(async () => {
    // Force refetch — usado pelos listeners de visibility/focus.
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
    await refetch()
  }, [queryClient, refetch])

  // Snapshot vazio enquanto carrega — componentes mostram skeleton se loading.
  const snapshot = data || EMPTY_SNAPSHOT

  return {
    profile: snapshot.profile,
    todayWorkout: snapshot.todayWorkout,
    todayMeals: snapshot.todayMeals,
    waterTotal: snapshot.waterTotal,
    waterGoal: snapshot.profile?.meta_agua_ml || 2000,
    streak: snapshot.profile?.streak_atual || 0,
    caloriesConsumed: snapshot.caloriesConsumed,
    caloriesGoal: snapshot.profile?.meta_calorias_diarias || 2500,
    proteinConsumed: snapshot.proteinConsumed,
    proteinGoal: snapshot.profile?.meta_proteina_g || 170,
    workoutStats: snapshot.workoutStats,
    sleepLoggedToday: snapshot.sleepLoggedToday,
    hasQualifyingActivityToday: snapshot.hasQualifyingActivityToday,
    loading: isLoading,
    error: error as Error | null,
    refresh,
  }
}

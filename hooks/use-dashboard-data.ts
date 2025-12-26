"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayISO } from '@/lib/utils/date'
import type { Profile } from '@/types/database'

export interface TodayWorkout {
  id: string
  nome: string
  tipo: string
  duracao_estimada: number
  exercicios_count: number
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_realizado?: string
  duracao_minutos?: number
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
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

// Dados mock para desenvolvimento
const mockProfile: Profile = {
  id: 'mock-user-id',
  nome: 'Leonardo',
  email: 'felicemed@gmail.com',
  data_nascimento: null,
  sexo: 'masculino',
  altura_cm: 175,
  peso_atual: 80,
  objetivo: 'hipertrofia',
  nivel_atividade: 'intenso',
  meta_calorias_diarias: 2500,
  meta_proteina_g: 170,
  meta_carboidrato_g: 300,
  meta_gordura_g: 80,
  meta_agua_ml: 3000,
  hora_acordar: '05:00',
  hora_dormir: '22:00',
  usa_medicamento_jejum: true,
  medicamento_nome: 'Revolade',
  medicamento_horario: '14:00',
  medicamento_jejum_antes_horas: 2,
  medicamento_restricao_depois_horas: 4,
  medicamento_restricao_tipo: 'laticínios',
  meta_peso: 75,
  meta_percentual_gordura: 12,
  meta_massa_muscular: null,
  data_meta: '2026-03-12',
  streak_atual: 12,
  maior_streak: 30,
  pontos_totais: 1250,
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

export function useDashboardData(): DashboardData {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null)
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([])
  const [waterTotal, setWaterTotal] = useState(0)
  const [caloriesConsumed, setCaloriesConsumed] = useState(0)
  const [proteinConsumed, setProteinConsumed] = useState(0)
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({ totalWorkouts: 0, prsThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usar dados mock se não houver usuário
        setProfile(mockProfile)
        setTodayWorkout(mockWorkout)
        setTodayMeals(mockMeals)
        setWaterTotal(1800)
        setCaloriesConsumed(1300)
        setProteinConsumed(95)
        return
      }

      const today = getTodayISO()

      // Buscar perfil
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('fitness_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
      } else {
        // Usar dados do auth como fallback se perfil não existir
        const userName = user.user_metadata?.full_name ||
                         user.user_metadata?.name ||
                         user.email?.split('@')[0] ||
                         'Usuário'
        setProfile({
          ...mockProfile,
          id: user.id,
          nome: userName,
          email: user.email || '',
        })

        if (profileError) {
          console.warn('Perfil não encontrado, usando dados do auth:', profileError.message)
        }
      }

      // Buscar água
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waterData } = await (supabase as any)
        .from('fitness_water_logs')
        .select('quantidade_ml')
        .eq('user_id', user.id)
        .eq('data', today)

      if (waterData && Array.isArray(waterData)) {
        const total = waterData.reduce(
          (acc: number, log: { quantidade_ml: number | null }) => acc + (log.quantidade_ml || 0),
          0
        )
        setWaterTotal(total)
      }

      // Buscar treino de hoje - primeiro buscar treino real (concluído ou em andamento)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workoutData } = await (supabase as any)
        .from('fitness_workouts')
        .select('id, nome, tipo, duracao_minutos, status')
        .eq('user_id', user.id)
        .eq('data', today)
        .maybeSingle()

      if (workoutData) {
        // Contar exercícios
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: exerciseCount } = await (supabase as any)
          .from('fitness_workout_exercises')
          .select('*', { count: 'exact', head: true })
          .eq('workout_id', workoutData.id)

        setTodayWorkout({
          id: workoutData.id,
          nome: workoutData.nome,
          tipo: workoutData.tipo,
          duracao_estimada: workoutData.duracao_minutos || 45,
          exercicios_count: exerciseCount || 0,
          status: (workoutData.status as TodayWorkout['status']) || 'pendente',
          duracao_minutos: workoutData.duracao_minutos ?? undefined
        })
      } else {
        // Não há treino real para hoje - buscar template para o dia da semana
        // getDay() retorna 0=domingo, 1=segunda, etc.
        // Usando timezone de São Paulo para garantir dia correto
        const nowSP = new Date(today + 'T12:00:00-03:00')
        const dayOfWeek = nowSP.getDay()

        console.log('Dashboard: Buscando template para dia_semana =', dayOfWeek, '(0=Dom, 1=Seg, ..., 6=Sab)')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: templateData, error: templateError } = await (supabase as any)
          .from('fitness_workout_templates')
          .select(`
            id, nome, tipo, duracao_estimada_min,
            exercicios:fitness_workout_template_exercises(id)
          `)
          .eq('user_id', user.id)
          .eq('is_ativo', true)
          .eq('dia_semana', dayOfWeek)
          .maybeSingle()

        if (templateError) {
          console.log('Dashboard: Erro ao buscar template:', templateError.message)
        }

        if (templateData) {
          console.log('Dashboard: Template encontrado:', templateData.nome)
          setTodayWorkout({
            id: `template-${today}-${templateData.id}`,
            nome: templateData.nome,
            tipo: templateData.tipo,
            duracao_estimada: templateData.duracao_estimada_min || 45,
            exercicios_count: templateData.exercicios?.length || 0,
            status: 'pendente'
          })
        } else {
          console.log('Dashboard: Nenhum template encontrado para dia_semana =', dayOfWeek, '- Dia de descanso')
          setTodayWorkout(null) // Dia de descanso
        }
      }

      // Buscar refeições de hoje
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData } = await (supabase as any)
        .from('fitness_meals')
        .select('tipo_refeicao, calorias_total, proteinas_total, horario')
        .eq('user_id', user.id)
        .eq('data', today)

      const mealTypes = ['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mealsMap = new Map(mealsData?.map((m: any) => [m.tipo_refeicao, m]) || [])

      const meals: TodayMeal[] = mealTypes.map(tipo => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meal = mealsMap.get(tipo) as any
        if (meal) {
          return {
            tipo,
            status: 'concluido' as const,
            horario: meal.horario ?? undefined,
            calorias: meal.calorias_total ?? undefined
          }
        }
        return { tipo, status: 'pendente' as const }
      })

      setTodayMeals(meals)

      // Calcular totais de nutrição
      if (mealsData && Array.isArray(mealsData)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalCal = mealsData.reduce((acc: number, m: any) => acc + (m.calorias_total || 0), 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalProt = mealsData.reduce((acc: number, m: any) => acc + (m.proteinas_total || 0), 0)
        setCaloriesConsumed(totalCal)
        setProteinConsumed(totalProt)
      }

      // Buscar estatísticas de treinos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: totalWorkoutsCount } = await (supabase as any)
        .from('fitness_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'concluido')

      // Buscar PRs do mês atual
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: prsCount } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select('*', { count: 'exact', head: true })
        .eq('is_pr', true)
        .gte('created_at', startOfMonth.toISOString())

      setWorkoutStats({
        totalWorkouts: totalWorkoutsCount || 0,
        prsThisMonth: prsCount || 0
      })

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err as Error)
      // Usar dados mock em caso de erro
      setProfile(mockProfile)
      setTodayWorkout(mockWorkout)
      setTodayMeals(mockMeals)
      setWaterTotal(1800)
      setCaloriesConsumed(1300)
      setProteinConsumed(95)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    profile,
    todayWorkout,
    todayMeals,
    waterTotal,
    waterGoal: profile?.meta_agua_ml || 3000,
    streak: profile?.streak_atual || 0,
    caloriesConsumed,
    caloriesGoal: profile?.meta_calorias_diarias || 2500,
    proteinConsumed,
    proteinGoal: profile?.meta_proteina_g || 170,
    workoutStats,
    loading,
    error,
    refresh: fetchData
  }
}

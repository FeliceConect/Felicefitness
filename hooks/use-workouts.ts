'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays, isToday, isBefore, isAfter, parseISO } from 'date-fns'
import { getTodayISO } from '@/lib/utils/date'
import type { Workout, WorkoutTemplate, DayWorkout, WorkoutExercise } from '@/lib/workout/types'

interface UseWorkoutsReturn {
  // Dados
  weekDays: DayWorkout[]
  todayWorkout: Workout | null
  upcomingWorkouts: DayWorkout[]
  recentWorkouts: DayWorkout[]
  templates: WorkoutTemplate[]

  // Estado
  loading: boolean
  error: string | null

  // Ações
  refresh: () => Promise<void>
  getWorkoutById: (id: string) => Workout | null
}

// Tipos do banco
interface DBWorkout {
  id: string
  user_id: string
  template_id: string | null
  nome: string
  tipo: string
  data: string
  hora_inicio: string | null
  hora_fim: string | null
  duracao_minutos: number | null
  status: string
  calorias_estimadas: number | null
  notas: string | null
  nivel_energia: number | null
  nivel_dificuldade: number | null
  created_at: string
}

interface DBTemplate {
  id: string
  user_id: string
  nome: string
  descricao: string | null
  tipo: string
  fase: string | null
  dia_semana: number | null
  duracao_estimada_min: number | null
  is_ativo: boolean
  ordem: number | null
}

interface DBTemplateExercise {
  id: string
  template_id: string
  exercise_id: string | null
  exercicio_nome: string
  ordem: number
  series: number
  repeticoes: string
  descanso_segundos: number | null
  carga_sugerida: number | null
  notas: string | null
  is_superset: boolean
  superset_grupo: number | null
}

interface DBWorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string | null
  exercicio_nome: string
  ordem: number
  status: string
  notas: string | null
}

interface DBWorkoutSet {
  id: string
  workout_exercise_id: string
  numero_serie: number
  repeticoes_planejadas: string | null
  repeticoes_realizadas: number | null
  carga_planejada: number | null
  carga_realizada: number | null
  status: string
  tempo_descanso_real: number | null
  notas: string | null
}

export function useWorkouts(): UseWorkoutsReturn {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [workouts, setWorkouts] = useState<DBWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const today = getTodayISO()

  // Carregar dados do Supabase
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Buscar templates ativos com exercícios
      const { data: templatesData, error: templatesError } = await supabase
        .from('fitness_workout_templates')
        .select(`
          *,
          exercicios:fitness_workout_template_exercises(*)
        `)
        .eq('user_id', user.id)
        .eq('is_ativo', true)
        .order('dia_semana', { ascending: true })

      if (templatesError) throw templatesError

      // Buscar treinos da semana atual
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekEnd = addDays(weekStart, 6)

      const { data: workoutsData, error: workoutsError } = await supabase
        .from('fitness_workouts')
        .select(`
          *,
          exercicios:fitness_workout_exercises(
            *,
            series:fitness_exercise_sets(*)
          )
        `)
        .eq('user_id', user.id)
        .gte('data', format(weekStart, 'yyyy-MM-dd'))
        .lte('data', format(weekEnd, 'yyyy-MM-dd'))
        .order('data', { ascending: true })

      if (workoutsError) throw workoutsError

      // Converter templates
      const convertedTemplates: WorkoutTemplate[] = (templatesData || []).map((t: DBTemplate & { exercicios: DBTemplateExercise[] }) => ({
        id: t.id,
        nome: t.nome,
        tipo: t.tipo as 'tradicional' | 'circuito' | 'hiit' | 'mobilidade',
        fase: (t.fase || 'base') as 'base' | 'construcao' | 'pico',
        dia_semana: t.dia_semana || 0,
        duracao_estimada: t.duracao_estimada_min || 30,
        exercicios: (t.exercicios || []).map(e => ({
          id: e.id,
          exercise_id: e.exercise_id || '',
          nome: e.exercicio_nome,
          ordem: e.ordem,
          series: e.series,
          repeticoes: e.repeticoes,
          descanso: e.descanso_segundos || 45,
          carga_sugerida: e.carga_sugerida || undefined,
          is_superset: e.is_superset || false
        }))
      }))

      setTemplates(convertedTemplates)
      setWorkouts(workoutsData || [])
    } catch (err) {
      console.error('Erro ao carregar treinos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [supabase, today])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Converter workout do banco para o tipo interno
  const convertWorkout = useCallback((w: DBWorkout & { exercicios?: (DBWorkoutExercise & { series?: DBWorkoutSet[] })[] }, template?: WorkoutTemplate): Workout => {
    const exercicios: WorkoutExercise[] = (w.exercicios || []).map(e => ({
      id: e.id,
      workout_id: e.workout_id,
      exercise_id: e.exercise_id || '',
      nome: e.exercicio_nome,
      ordem: e.ordem,
      is_superset: false,
      series: (e.series || []).map(s => ({
        id: s.id,
        workout_exercise_id: s.workout_exercise_id,
        numero_serie: s.numero_serie,
        repeticoes_planejadas: s.repeticoes_planejadas || '',
        carga_planejada: s.carga_planejada || undefined,
        status: s.status as 'pendente' | 'concluido' | 'pulado'
      }))
    }))

    // Se não tem exercícios no workout mas tem template, usar do template
    if (exercicios.length === 0 && template) {
      return {
        id: w.id,
        template_id: w.template_id || undefined,
        user_id: w.user_id,
        nome: w.nome,
        tipo: w.tipo as 'tradicional' | 'circuito' | 'hiit' | 'mobilidade',
        fase: template.fase,
        data: w.data,
        status: w.status as 'pendente' | 'em_andamento' | 'concluido',
        duracao_estimada: template.duracao_estimada,
        duracao_real: w.duracao_minutos || undefined,
        created_at: w.created_at,
        exercicios: template.exercicios.map((te, idx) => ({
          id: `${w.id}-ex-${idx}`,
          workout_id: w.id,
          exercise_id: te.exercise_id,
          nome: te.nome,
          ordem: te.ordem,
          is_superset: te.is_superset,
          series: Array.from({ length: te.series }, (_, i) => ({
            id: `${w.id}-set-${idx}-${i}`,
            workout_exercise_id: `${w.id}-ex-${idx}`,
            numero_serie: i + 1,
            repeticoes_planejadas: te.repeticoes,
            carga_planejada: te.carga_sugerida,
            status: 'pendente' as const
          }))
        }))
      }
    }

    return {
      id: w.id,
      template_id: w.template_id || undefined,
      user_id: w.user_id,
      nome: w.nome,
      tipo: w.tipo as 'tradicional' | 'circuito' | 'hiit' | 'mobilidade',
      data: w.data,
      status: w.status as 'pendente' | 'em_andamento' | 'concluido',
      duracao_estimada: 30,
      duracao_real: w.duracao_minutos || undefined,
      created_at: w.created_at,
      exercicios
    }
  }, [])

  // Gerar semana de treinos
  const weekDays = useMemo((): DayWorkout[] => {
    const todayDate = new Date()
    const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 })

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const dayOfWeek = date.getDay()
      const dateStr = format(date, 'yyyy-MM-dd')

      // Verificar se existe treino real para este dia
      // Priorizar treinos concluídos sobre pendentes
      const dayWorkouts = workouts.filter(w => w.data === dateStr)
      const realWorkout = dayWorkouts.find(w => w.status === 'concluido') || dayWorkouts[0]

      // Buscar template para este dia da semana
      const template = templates.find(t => t.dia_semana === dayOfWeek)

      // Determinar status
      let status: DayWorkout['status'] = 'future'
      if (isBefore(date, todayDate) && !isToday(date)) {
        status = realWorkout?.status === 'concluido' ? 'completed' : 'missed'
      } else if (isToday(date)) {
        status = realWorkout?.status === 'concluido' ? 'completed' : 'pending'
      }

      // Determinar tipo (descanso, atividade especial, etc)
      let type: string | undefined
      let icon: string | undefined

      if (dayOfWeek === 0) {
        status = isAfter(date, todayDate) ? 'future' : 'rest'
        type = 'rest'
      } else if (dayOfWeek === 6) {
        type = 'beach_tennis'
        icon = '🎾'
      }

      // Criar workout object
      let workout: Workout | undefined

      if (realWorkout) {
        workout = convertWorkout(realWorkout as DBWorkout & { exercicios?: (DBWorkoutExercise & { series?: DBWorkoutSet[] })[] }, template)
      } else if (template && dayOfWeek !== 0) {
        // Criar workout baseado no template
        workout = {
          id: `template-${dateStr}-${template.id}`,
          template_id: template.id,
          user_id: '',
          nome: template.nome,
          tipo: template.tipo,
          fase: template.fase,
          data: dateStr,
          status: 'pendente',
          duracao_estimada: template.duracao_estimada,
          created_at: new Date().toISOString(),
          exercicios: template.exercicios.map((te, idx) => ({
            id: `template-${dateStr}-ex-${idx}`,
            workout_id: `template-${dateStr}-${template.id}`,
            exercise_id: te.exercise_id,
            nome: te.nome,
            ordem: te.ordem,
            is_superset: te.is_superset,
            series: Array.from({ length: te.series }, (_, i) => ({
              id: `template-${dateStr}-set-${idx}-${i}`,
              workout_exercise_id: `template-${dateStr}-ex-${idx}`,
              numero_serie: i + 1,
              repeticoes_planejadas: te.repeticoes,
              carga_planejada: te.carga_sugerida,
              status: 'pendente' as const
            }))
          }))
        }
      }

      return {
        date,
        dayOfWeek,
        dayOfMonth: date.getDate(),
        status,
        workout,
        type,
        icon
      }
    })
  }, [templates, workouts, convertWorkout])

  // Treino de hoje
  const todayWorkout = useMemo(() => {
    const todayDay = weekDays.find(d => isToday(d.date))
    return todayDay?.workout || null
  }, [weekDays])

  // Próximos treinos
  const upcomingWorkouts = useMemo(() => {
    return weekDays
      .filter(d => (d.status === 'pending' || d.status === 'future') && d.workout)
      .slice(0, 3)
  }, [weekDays])

  // Treinos recentes
  const recentWorkouts = useMemo(() => {
    return weekDays
      .filter(d => d.status === 'completed' && d.workout)
      .reverse()
      .slice(0, 3)
  }, [weekDays])

  // Buscar treino por ID
  const getWorkoutById = useCallback((id: string): Workout | null => {
    // Primeiro buscar nos workouts reais
    const realWorkout = workouts.find(w => w.id === id)
    if (realWorkout) {
      const template = templates.find(t => t.id === realWorkout.template_id)
      return convertWorkout(realWorkout as DBWorkout & { exercicios?: (DBWorkoutExercise & { series?: DBWorkoutSet[] })[] }, template)
    }

    // Se não encontrou, buscar nos dias da semana (pode ser template)
    const day = weekDays.find(d => d.workout?.id === id)
    return day?.workout || null
  }, [workouts, templates, weekDays, convertWorkout])

  return {
    weekDays,
    todayWorkout,
    upcomingWorkouts,
    recentWorkouts,
    templates,
    loading,
    error,
    refresh: loadData,
    getWorkoutById
  }
}

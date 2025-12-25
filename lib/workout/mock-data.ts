// Dados mock para desenvolvimento - Treinos do Leonardo
import type { Workout, WorkoutTemplate, DayWorkout, ExerciseSet, WorkoutExercise } from './types'
import { addDays, startOfWeek, format, isToday, isBefore, isAfter } from 'date-fns'

// Templates de treino - Janeiro (Fase Base)
export const mockTemplates: WorkoutTemplate[] = [
  {
    id: 'template-pernas-a',
    nome: 'Pernas A - Força',
    tipo: 'tradicional',
    fase: 'base',
    dia_semana: 1, // Segunda
    duracao_estimada: 30,
    exercicios: [
      { id: 'te-1', exercise_id: 'ex-leg-press', nome: 'Leg Press', ordem: 1, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 80 },
      { id: 'te-2', exercise_id: 'ex-agach-goblet', nome: 'Agachamento Goblet', ordem: 2, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 20 },
      { id: 'te-3', exercise_id: 'ex-extensora', nome: 'Cadeira Extensora', ordem: 3, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 45 },
      { id: 'te-4', exercise_id: 'ex-stiff', nome: 'Stiff', ordem: 4, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 30 },
      { id: 'te-5', exercise_id: 'ex-panturrilha', nome: 'Panturrilha', ordem: 5, series: 3, repeticoes: '15', descanso: 30, carga_sugerida: 60, is_superset: true },
      { id: 'te-6', exercise_id: 'ex-ponte', nome: 'Ponte Glúteos', ordem: 6, series: 3, repeticoes: '15', descanso: 30, is_superset: true },
    ]
  },
  {
    id: 'template-mobilidade',
    nome: 'Mobilidade + Core',
    tipo: 'mobilidade',
    fase: 'base',
    dia_semana: 2, // Terça
    duracao_estimada: 25,
    exercicios: [
      { id: 'te-7', exercise_id: 'ex-cat-cow', nome: 'Cat-Cow', ordem: 1, series: 1, repeticoes: '10', descanso: 0 },
      { id: 'te-8', exercise_id: 'ex-rotacao', nome: 'Rotação Torácica', ordem: 2, series: 1, repeticoes: '8 cada', descanso: 0 },
      { id: 'te-9', exercise_id: 'ex-piriforme', nome: 'Alongamento Piriforme', ordem: 3, series: 1, repeticoes: '30s cada', descanso: 0 },
      { id: 'te-10', exercise_id: 'ex-90-90', nome: 'Mobilidade Quadril 90/90', ordem: 4, series: 1, repeticoes: '8 cada', descanso: 0 },
      { id: 'te-11', exercise_id: 'ex-bird-dog', nome: 'Bird Dog', ordem: 5, series: 3, repeticoes: '8 cada', descanso: 30 },
      { id: 'te-12', exercise_id: 'ex-dead-bug', nome: 'Dead Bug', ordem: 6, series: 3, repeticoes: '8 cada', descanso: 30 },
      { id: 'te-13', exercise_id: 'ex-ponte-core', nome: 'Ponte de Glúteos', ordem: 7, series: 3, repeticoes: '12', descanso: 30 },
      { id: 'te-14', exercise_id: 'ex-prancha', nome: 'Prancha', ordem: 8, series: 3, repeticoes: '30s', descanso: 30 },
    ]
  },
  {
    id: 'template-upper',
    nome: 'Upper + Core',
    tipo: 'tradicional',
    fase: 'base',
    dia_semana: 3, // Quarta
    duracao_estimada: 30,
    exercicios: [
      { id: 'te-15', exercise_id: 'ex-supino', nome: 'Supino Máquina', ordem: 1, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 40 },
      { id: 'te-16', exercise_id: 'ex-remada', nome: 'Remada Máquina', ordem: 2, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 45 },
      { id: 'te-17', exercise_id: 'ex-desenvolvimento', nome: 'Desenvolvimento Ombro', ordem: 3, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 12 },
      { id: 'te-18', exercise_id: 'ex-rosca', nome: 'Rosca Direta', ordem: 4, series: 3, repeticoes: '12', descanso: 30, carga_sugerida: 10 },
      { id: 'te-19', exercise_id: 'ex-triceps', nome: 'Tríceps Corda', ordem: 5, series: 3, repeticoes: '12', descanso: 30, carga_sugerida: 15 },
      { id: 'te-20', exercise_id: 'ex-prancha-f', nome: 'Prancha Frontal', ordem: 6, series: 3, repeticoes: '30s', descanso: 30 },
      { id: 'te-21', exercise_id: 'ex-dead-bug-2', nome: 'Dead Bug', ordem: 7, series: 3, repeticoes: '10 cada', descanso: 30 },
    ]
  },
  {
    id: 'template-pernas-b',
    nome: 'Pernas B - Resistência',
    tipo: 'tradicional',
    fase: 'base',
    dia_semana: 4, // Quinta
    duracao_estimada: 30,
    exercicios: [
      { id: 'te-22', exercise_id: 'ex-afundo', nome: 'Afundo Búlgaro', ordem: 1, series: 3, repeticoes: '10 cada', descanso: 45, carga_sugerida: 10 },
      { id: 'te-23', exercise_id: 'ex-sumo', nome: 'Agachamento Sumô', ordem: 2, series: 3, repeticoes: '15', descanso: 45, carga_sugerida: 16 },
      { id: 'te-24', exercise_id: 'ex-step-up', nome: 'Step Up', ordem: 3, series: 3, repeticoes: '12 cada', descanso: 45, carga_sugerida: 8 },
      { id: 'te-25', exercise_id: 'ex-stiff-2', nome: 'Stiff', ordem: 4, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 30 },
      { id: 'te-26', exercise_id: 'ex-iso-parede', nome: 'Agachamento Isométrico Parede', ordem: 5, series: 3, repeticoes: '30s', descanso: 30 },
      { id: 'te-27', exercise_id: 'ex-pant-uni', nome: 'Panturrilha Unilateral', ordem: 6, series: 3, repeticoes: '12 cada', descanso: 30 },
    ]
  },
  {
    id: 'template-upper-2',
    nome: 'Upper + Core',
    tipo: 'tradicional',
    fase: 'base',
    dia_semana: 5, // Sexta
    duracao_estimada: 30,
    exercicios: [
      { id: 'te-28', exercise_id: 'ex-supino', nome: 'Supino Máquina', ordem: 1, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 40 },
      { id: 'te-29', exercise_id: 'ex-remada', nome: 'Remada Máquina', ordem: 2, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 45 },
      { id: 'te-30', exercise_id: 'ex-desenvolvimento', nome: 'Desenvolvimento Ombro', ordem: 3, series: 3, repeticoes: '12', descanso: 45, carga_sugerida: 12 },
      { id: 'te-31', exercise_id: 'ex-rosca', nome: 'Rosca Direta', ordem: 4, series: 3, repeticoes: '12', descanso: 30, carga_sugerida: 10 },
      { id: 'te-32', exercise_id: 'ex-triceps', nome: 'Tríceps Corda', ordem: 5, series: 3, repeticoes: '12', descanso: 30, carga_sugerida: 15 },
      { id: 'te-33', exercise_id: 'ex-prancha-f', nome: 'Prancha Frontal', ordem: 6, series: 3, repeticoes: '30s', descanso: 30 },
    ]
  },
]

// Gerar séries para um exercício
function generateSets(exerciseId: string, numSeries: number, reps: string, carga?: number): ExerciseSet[] {
  return Array.from({ length: numSeries }, (_, i) => ({
    id: `set-${exerciseId}-${i + 1}`,
    workout_exercise_id: exerciseId,
    numero_serie: i + 1,
    repeticoes_planejadas: reps,
    carga_planejada: carga,
    status: 'pendente' as const
  }))
}

// Gerar exercícios de workout a partir de template
function generateWorkoutExercises(template: WorkoutTemplate, workoutId: string): WorkoutExercise[] {
  return template.exercicios.map(te => ({
    id: `we-${workoutId}-${te.ordem}`,
    workout_id: workoutId,
    exercise_id: te.exercise_id,
    nome: te.nome,
    ordem: te.ordem,
    is_superset: te.is_superset,
    series: generateSets(`we-${workoutId}-${te.ordem}`, te.series, te.repeticoes, te.carga_sugerida)
  }))
}

// Gerar treino de hoje
export function getTodayWorkout(): Workout | null {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Domingo

  // Converter para nosso formato (1 = Segunda)
  const template = mockTemplates.find(t => t.dia_semana === dayOfWeek)

  if (!template) {
    // Verificar se é sábado (beach tennis)
    if (dayOfWeek === 6) {
      return {
        id: 'workout-beach-today',
        user_id: 'mock-user',
        nome: 'Beach Tennis',
        tipo: 'mobilidade',
        data: format(today, 'yyyy-MM-dd'),
        status: 'pendente',
        duracao_estimada: 60,
        created_at: new Date().toISOString(),
        exercicios: []
      }
    }
    return null // Dia de descanso
  }

  const workoutId = `workout-today-${format(today, 'yyyy-MM-dd')}`

  return {
    id: workoutId,
    template_id: template.id,
    user_id: 'mock-user',
    nome: template.nome,
    tipo: template.tipo,
    fase: template.fase,
    data: format(today, 'yyyy-MM-dd'),
    status: 'pendente',
    duracao_estimada: template.duracao_estimada,
    created_at: new Date().toISOString(),
    exercicios: generateWorkoutExercises(template, workoutId)
  }
}

// Gerar semana de treinos
export function getWeekWorkouts(): DayWorkout[] {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Segunda

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayOfWeek = date.getDay()

    // Determinar status e tipo
    let status: DayWorkout['status'] = 'future'
    let workout: Workout | undefined
    let type: string | undefined
    let icon: string | undefined

    const template = mockTemplates.find(t => t.dia_semana === dayOfWeek)

    if (isBefore(date, today) && !isToday(date)) {
      // Dias passados - simulando alguns como completados
      status = Math.random() > 0.2 ? 'completed' : 'missed'
    } else if (isToday(date)) {
      status = 'pending'
    }

    if (dayOfWeek === 0) {
      // Domingo - descanso
      status = isAfter(date, today) ? 'future' : 'rest'
      type = 'rest'
    } else if (dayOfWeek === 6) {
      // Sábado - Beach Tennis
      type = 'beach_tennis'
      icon = '🎾'
    }

    if (template) {
      const workoutId = `workout-${format(date, 'yyyy-MM-dd')}`
      workout = {
        id: workoutId,
        template_id: template.id,
        user_id: 'mock-user',
        nome: template.nome,
        tipo: template.tipo,
        fase: template.fase,
        data: format(date, 'yyyy-MM-dd'),
        status: status === 'completed' ? 'concluido' : 'pendente',
        duracao_estimada: template.duracao_estimada,
        duracao_real: status === 'completed' ? Math.round(template.duracao_estimada * (0.8 + Math.random() * 0.4)) : undefined,
        created_at: date.toISOString(),
        exercicios: generateWorkoutExercises(template, workoutId)
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
}

// Dados de histórico de um exercício (últimas execuções)
export function getExerciseLastWeight(exerciseId: string): { weight: number; reps: number } | null {
  // Simular últimas cargas
  const lastWeights: Record<string, { weight: number; reps: number }> = {
    'ex-leg-press': { weight: 80, reps: 12 },
    'ex-agach-goblet': { weight: 20, reps: 12 },
    'ex-extensora': { weight: 45, reps: 12 },
    'ex-stiff': { weight: 30, reps: 12 },
    'ex-panturrilha': { weight: 60, reps: 15 },
    'ex-supino': { weight: 40, reps: 12 },
    'ex-remada': { weight: 45, reps: 12 },
    'ex-desenvolvimento': { weight: 12, reps: 12 },
    'ex-rosca': { weight: 10, reps: 12 },
    'ex-triceps': { weight: 15, reps: 12 },
  }

  return lastWeights[exerciseId] || null
}

// PRs por exercício
export function getExercisePR(exerciseId: string): { weight: number; reps: number } | null {
  const prs: Record<string, { weight: number; reps: number }> = {
    'ex-leg-press': { weight: 85, reps: 12 },
    'ex-agach-goblet': { weight: 24, reps: 12 },
    'ex-extensora': { weight: 50, reps: 12 },
    'ex-stiff': { weight: 35, reps: 12 },
    'ex-panturrilha': { weight: 70, reps: 15 },
    'ex-supino': { weight: 45, reps: 12 },
    'ex-remada': { weight: 50, reps: 12 },
  }

  return prs[exerciseId] || null
}

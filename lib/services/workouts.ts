import { getSupabase, getCurrentUserId, ServiceError } from './base'

export interface Workout {
  id: string
  user_id: string
  template_id?: string
  nome: string
  data: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  duracao_minutos?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export async function getWorkouts(limit = 10): Promise<Workout[]> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('fitness_workouts')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(limit)

  if (error) throw new ServiceError('Erro ao buscar treinos', error.code, error.message)
  return (data ?? []) as Workout[]
}

export async function getWorkoutById(id: string): Promise<Workout> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('fitness_workouts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new ServiceError('Erro ao buscar treino', error.code, error.message)
  return data as Workout
}

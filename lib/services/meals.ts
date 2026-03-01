import { getSupabase, getCurrentUserId, ServiceError } from './base'
import { getTodayISO } from '@/lib/utils/date'

export interface Meal {
  id: string
  user_id: string
  data: string
  tipo: string
  nome?: string
  calorias?: number
  proteinas?: number
  carboidratos?: number
  gorduras?: number
  created_at: string
}

export async function getDailyMeals(date?: string): Promise<Meal[]> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()
  const dateStr = date ?? getTodayISO()

  const { data, error } = await supabase
    .from('fitness_meals')
    .select('*')
    .eq('user_id', userId)
    .eq('data', dateStr)
    .order('created_at', { ascending: true })

  if (error) throw new ServiceError('Erro ao buscar refeições', error.code, error.message)
  return (data ?? []) as Meal[]
}

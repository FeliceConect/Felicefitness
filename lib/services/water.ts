import { getSupabase, getCurrentUserId, ServiceError } from './base'
import { getTodayISO } from '@/lib/utils/date'

export interface WaterLog {
  id: string
  user_id: string
  data: string
  horario: string
  quantidade_ml: number
}

export async function getWaterLogs(date?: string): Promise<WaterLog[]> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()
  const dateStr = date ?? getTodayISO()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_water_logs')
    .select('id, user_id, data, horario, quantidade_ml')
    .eq('user_id', userId)
    .eq('data', dateStr)
    .order('horario', { ascending: false })

  if (error) throw new ServiceError('Erro ao buscar logs de água', error.code, error.message)
  return (data ?? []) as WaterLog[]
}

export async function addWaterLog(ml: number, date?: string): Promise<WaterLog> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_water_logs')
    .insert({
      user_id: userId,
      data: date ?? getTodayISO(),
      horario: new Date().toISOString(),
      quantidade_ml: ml,
    })
    .select('id, user_id, data, horario, quantidade_ml')
    .single()

  if (error) throw new ServiceError('Erro ao registrar água', error.code, error.message)
  return data as WaterLog
}

export async function deleteWaterLog(id: string): Promise<void> {
  const supabase = getSupabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('fitness_water_logs')
    .delete()
    .eq('id', id)

  if (error) throw new ServiceError('Erro ao remover registro', error.code, error.message)
}

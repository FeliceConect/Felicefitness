import { getSupabase, getCurrentUserId, ServiceError } from './base'

export interface Profile {
  id: string
  nome: string
  email: string
  data_nascimento?: string
  sexo?: string
  altura_cm?: number
  peso_atual?: number
  objetivo?: string
  nivel_atividade?: string
  foto_url?: string
  streak_atual: number
  maior_streak: number
  pontos_totais: number
  onboarding_completed: boolean
  role?: string
  display_name?: string
  created_at: string
  updated_at: string
}

export async function getProfile(userId?: string): Promise<Profile> {
  const supabase = getSupabase()
  const id = userId ?? await getCurrentUserId()

  const { data, error } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new ServiceError('Erro ao buscar perfil', error.code, error.message)
  return data as Profile
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (supabase as any)
    .from('fitness_profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new ServiceError('Erro ao atualizar perfil', error.code, error.message)
  return updated as Profile
}

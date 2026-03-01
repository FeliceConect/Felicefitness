import { createClient } from '@/lib/supabase/client'

export function getSupabase() {
  return createClient()
}

export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Usuário não autenticado')
  return user.id
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

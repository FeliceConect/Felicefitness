import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Autorização única das fotos de evolução do paciente.
 *
 * Vive em um só arquivo de propósito: as fotos são de corpo em roupa íntima
 * (dado sensível, LGPD) e o proxy é o único caminho de leitura. Quando a regra
 * estava copiada em cada rota, endurecer uma delas deixava as outras abertas.
 */

const CLINICAL_ROLES = ['nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo']

/**
 * Secretária e suporte administram agenda e cadastro, não prontuário — a UI já
 * os esconde, mas a regra precisa valer no servidor (CLAUDE.md: "admin →
 * Secretária. NÃO vê dados clínicos").
 */
const BLOCKED_ADMIN_TYPES = ['secretary', 'support', 'manager']

const ALLOWED_ROLES = ['super_admin', 'admin', ...CLINICAL_ROLES]

function getAdminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type AuthFailure = { error: NextResponse }
type AuthSuccess = { user: { id: string }; role: string; supabaseAdmin: SupabaseClient }

function deny(message: string, status: number): AuthFailure {
  return { error: NextResponse.json({ success: false, error: message }, { status }) }
}

/**
 * Exige sessão de alguém que pode ver as fotos de `patientId`. Profissional
 * clínico precisa estar ativo e vinculado ao paciente; super_admin não.
 */
export async function requirePhotoAccess(patientId?: string): Promise<AuthFailure | AuthSuccess> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return deny('Não autorizado', 401)

  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role, admin_type')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return deny('Acesso negado', 403)
  }

  if (profile.role === 'admin' && BLOCKED_ADMIN_TYPES.includes(profile.admin_type ?? '')) {
    return deny('Acesso negado', 403)
  }

  if (patientId && CLINICAL_ROLES.includes(profile.role)) {
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!professional) return deny('Profissional inativo', 403)

    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', patientId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!assignment) return deny('Paciente não vinculado', 403)
  }

  return { user, role: profile.role, supabaseAdmin }
}

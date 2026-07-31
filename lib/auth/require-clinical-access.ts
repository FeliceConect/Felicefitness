/**
 * Autorização de acesso a DADO CLÍNICO de um paciente.
 *
 * Toda escrita de profissional no app usa a service role key, que ignora RLS.
 * Isso quer dizer que a checagem feita aqui é a única barreira real — um bug
 * neste arquivo é bypass total de autorização.
 *
 * A lógica já estava duplicada com variações em várias rotas, e as variações
 * são exatamente onde os buracos apareceram (rotas que aceitam qualquer
 * clientId sem vínculo, ou que nem checam papel). Por isso ela mora aqui.
 *
 * Diferença importante em relação ao padrão antigo: o papel `admin` (a
 * secretária) NÃO tem acesso por default. O CLAUDE.md determina que ela não vê
 * dado clínico. Quem precisar do comportamento antigo pede explicitamente com
 * `allowSecretaryAdmin`.
 */

import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'

export const CLINICAL_ROLES = [
  'nutritionist',
  'trainer',
  'coach',
  'physiotherapist',
  'medico_integrativo',
] as const

export type ClinicalRole = (typeof CLINICAL_ROLES)[number]

export function getAdminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface ClinicalAccessOptions {
  /**
   * Papéis clínicos aceitos. Default: todos. Use para restringir uma rota a
   * uma especialidade (ex.: só nutricionista lança avaliação por ultrassom).
   */
  allowedClinicalRoles?: readonly ClinicalRole[]
  /**
   * Aceita o papel `admin` (secretária). Default FALSE: dado clínico não é
   * função administrativa.
   */
  allowSecretaryAdmin?: boolean
  /**
   * Exige vínculo ativo com o paciente para papéis clínicos. Default TRUE.
   * `super_admin` sempre passa direto.
   */
  requireAssignment?: boolean
}

export interface ClinicalAccessGranted {
  user: User
  role: string
  isSuperAdmin: boolean
  /** Id em fitness_professionals, quando o solicitante for um profissional. */
  professionalId: string | null
  supabaseAdmin: SupabaseClient
}

export type ClinicalAccessResult =
  | { error: NextResponse }
  | ClinicalAccessGranted

function deny(message: string, status: number): { error: NextResponse } {
  return { error: NextResponse.json({ success: false, error: message }, { status }) }
}

/**
 * Verifica se o usuário autenticado pode ler ou escrever dado clínico do
 * paciente informado.
 *
 * Uso na rota:
 *   const acesso = await requireClinicalAccess(params.id, { allowedClinicalRoles: ['nutritionist'] })
 *   if ('error' in acesso) return acesso.error
 *   const { supabaseAdmin, user } = acesso
 */
export async function requireClinicalAccess(
  patientId: string | null,
  options: ClinicalAccessOptions = {}
): Promise<ClinicalAccessResult> {
  const {
    allowedClinicalRoles = CLINICAL_ROLES,
    allowSecretaryAdmin = false,
    requireAssignment = true,
  } = options

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return deny('Não autorizado', 401)
  }

  const supabaseAdmin = getAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role: string | null = profile?.role ?? null
  if (!role) {
    return deny('Acesso negado', 403)
  }

  // super_admin (Leonardo/Marinella) passa sempre, inclusive sem registro em
  // fitness_professionals — não exigir isso é o que evita o bug de bloquear a
  // própria direção da clínica.
  if (role === 'super_admin') {
    return { user, role, isSuperAdmin: true, professionalId: null, supabaseAdmin }
  }

  if (role === 'admin') {
    if (!allowSecretaryAdmin) {
      return deny('Acesso restrito a dado clínico', 403)
    }
    return { user, role, isSuperAdmin: false, professionalId: null, supabaseAdmin }
  }

  if (!(allowedClinicalRoles as readonly string[]).includes(role)) {
    return deny('Acesso restrito', 403)
  }

  const { data: professional } = await supabaseAdmin
    .from('fitness_professionals')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!professional) {
    return deny('Profissional inativo', 403)
  }

  if (requireAssignment) {
    if (!patientId) {
      return deny('Paciente não informado', 400)
    }

    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', patientId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!assignment) {
      return deny('Paciente não vinculado', 403)
    }
  }

  return {
    user,
    role,
    isSuperAdmin: false,
    professionalId: professional.id as string,
    supabaseAdmin,
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const SUPERADMIN_EMAIL = 'felicemed@gmail.com'

// Colunas que NÃO representam dado de medição (metadados). Uma linha é
// considerada "vazia" quando nenhuma coluna fora desta lista possui valor.
const META_COLUMNS = new Set([
  'id',
  'user_id',
  'data',
  'created_at',
  'updated_at',
  'momento_avaliacao',
  'avaliador_id',
  'horario_coleta',
  'fonte',
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEmptyRecord(row: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(row)) {
    if (META_COLUMNS.has(key)) continue
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'object') {
      // jsonb (impedancia_dados): só conta se tiver conteúdo
      const hasContent = Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0
      if (hasContent) return false
      continue
    }
    // qualquer valor numérico/texto preenchido (peso, circ_*, métricas, foto_url, notas...)
    return false
  }
  return true
}

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 }) }
  }
  if (user.email !== SUPERADMIN_EMAIL) {
    return { error: NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 }) }
  }
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  return { supabaseAdmin }
}

async function getEmptyIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
): Promise<{ emptyIds: string[]; total: number } | { error: NextResponse }> {
  const { data: records, error } = await supabaseAdmin
    .from('fitness_body_compositions')
    .select('*')

  if (error) {
    console.error('Erro ao buscar bioimpedâncias:', error)
    return { error: NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 }) }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emptyIds = (records || []).filter((r: Record<string, any>) => isEmptyRecord(r)).map((r: { id: string }) => r.id)
  return { emptyIds, total: records?.length || 0 }
}

// GET - Prévia: quantos registros vazios existem (sem apagar)
export async function GET() {
  try {
    const auth = await authorize()
    if ('error' in auth) return auth.error

    const result = await getEmptyIds(auth.supabaseAdmin)
    if ('error' in result) return result.error

    return NextResponse.json({ success: true, emptyCount: result.emptyIds.length, total: result.total })
  } catch (error) {
    console.error('Erro GET cleanup bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Apaga todos os registros de bioimpedância vazios (sem nenhum dado)
export async function POST() {
  try {
    const auth = await authorize()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const result = await getEmptyIds(supabaseAdmin)
    if ('error' in result) return result.error

    if (result.emptyIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'Nenhuma bioimpedância vazia encontrada' })
    }

    const { error: delError } = await supabaseAdmin
      .from('fitness_body_compositions')
      .delete()
      .in('id', result.emptyIds)

    if (delError) {
      console.error('Erro ao apagar bioimpedâncias vazias:', delError)
      return NextResponse.json({ success: false, error: 'Erro ao apagar: ' + delError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: result.emptyIds.length,
      message: `${result.emptyIds.length} bioimpedância(s) vazia(s) removida(s)`,
    })
  } catch (error) {
    console.error('Erro POST cleanup bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

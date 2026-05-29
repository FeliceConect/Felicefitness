/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { recalculateChainFrom } from '@/lib/bioimpedance/award'
import { calculateBioimpedancePoints, type BioSnapshot } from '@/lib/bioimpedance/points-calculator'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface ChainRow extends BioSnapshot {
  id: string
  data: string
  created_at: string
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Apenas super admin' }, { status: 403 }) }
  }
  return { supabaseAdmin }
}

// Carrega todas as medições agrupadas por usuário, ordenadas por (data, created_at) asc.
async function loadChains(supabaseAdmin: any): Promise<Map<string, ChainRow[]>> {
  const { data: rows } = await supabaseAdmin
    .from('fitness_body_compositions')
    .select('id, user_id, data, created_at, massa_gordura_kg, massa_muscular_esqueletica_kg, gordura_visceral')
    .order('data', { ascending: true })
    .order('created_at', { ascending: true })

  const byUser = new Map<string, ChainRow[]>()
  for (const r of (rows || [])) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id)!.push(r)
  }
  return byUser
}

function hasComposition(r: ChainRow): boolean {
  return r.massa_gordura_kg != null || r.massa_muscular_esqueletica_kg != null || r.gordura_visceral != null
}

// "anterior" = bioimpedância REAL mais recente com data ESTRITAMENTE menor
// (espelha getPreviousRecord: ignora registros que só têm peso).
function previousOf(chain: ChainRow[], i: number): ChainRow | null {
  for (let j = i - 1; j >= 0; j--) {
    if (chain[j].data < chain[i].data && hasComposition(chain[j])) return chain[j]
  }
  return null
}

// GET — PREVIEW (dry-run, sem gravar nada). Mostra quanto cada paciente passaria
// a ter de pontos de bioimpedância sob a fórmula atual. Negativos primeiro.
export async function GET() {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const byUser = await loadChains(supabaseAdmin)
    const userIds = Array.from(byUser.keys())
    const { data: profs } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome')
      .in('id', userIds)
    const nameMap = new Map((profs || []).map((p: any) => [p.id, p.nome]))

    const preview: Array<{ nome: string; total: number; records: Array<{ data: string; points: number; reason: string }> }> = []
    for (const [uid, chain] of Array.from(byUser.entries())) {
      let total = 0
      const records: Array<{ data: string; points: number; reason: string }> = []
      for (let i = 0; i < chain.length; i++) {
        const prev = previousOf(chain, i)
        const bd = calculateBioimpedancePoints(prev, chain[i])
        if (bd && bd.total !== 0) {
          total += bd.total
          records.push({ data: chain[i].data, points: bd.total, reason: bd.reason })
        }
      }
      if (records.length > 0) preview.push({ nome: nameMap.get(uid) || uid, total, records })
    }
    preview.sort((a, b) => a.total - b.total) // negativos no topo, para revisão

    return NextResponse.json({
      success: true,
      dryRun: true,
      aviso: 'Pré-visualização — nada foi gravado. Para aplicar, faça POST nesta mesma rota.',
      pacientes: preview.length,
      preview,
    })
  } catch (error) {
    console.error('Erro no preview recalc-bio:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST — APLICA: recalcula em cadeia a bioimpedância de TODOS os pacientes,
// regravando as transações e ajustando o ranking sob a fórmula atual.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    // confirmação explícita para evitar disparo acidental
    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== 'RECALC') {
      return NextResponse.json(
        { success: false, error: 'Envie { "confirm": "RECALC" } para aplicar. Use GET para pré-visualizar.' },
        { status: 400 }
      )
    }

    const byUser = await loadChains(supabaseAdmin)
    let processed = 0
    const errors: Array<{ user_id: string; error: string }> = []
    for (const [uid, chain] of Array.from(byUser.entries())) {
      if (chain.length === 0) continue
      try {
        await recalculateChainFrom(supabaseAdmin, uid, chain[0].data)
        processed++
      } catch (e: any) {
        errors.push({ user_id: uid, error: e?.message || 'erro' })
      }
    }

    return NextResponse.json({ success: true, dryRun: false, processed, errors })
  } catch (error) {
    console.error('Erro ao aplicar recalc-bio:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

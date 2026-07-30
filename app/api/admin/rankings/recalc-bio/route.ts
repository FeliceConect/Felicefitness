/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { recalculateChainFrom } from '@/lib/bioimpedance/award'
import { auditBioimpedancePoints, loadChains } from '@/lib/bioimpedance/audit'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
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

// GET — PREVIEW (dry-run, sem gravar nada). Mostra o que cada paciente tem
// lançado hoje x o que a fórmula atual calcularia, e o efeito líquido do POST.
// A lógica vive em lib/bioimpedance/audit.ts, compartilhada com /bio-audit.
export async function GET() {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const audit = await auditBioimpedancePoints(supabaseAdmin)
    return NextResponse.json({
      success: true,
      dryRun: true,
      aviso: 'Pré-visualização — nada foi gravado. Para aplicar, faça POST nesta mesma rota com { "confirm": "RECALC" }.',
      ...audit,
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

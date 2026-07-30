/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Correção completa do ranking (superadmin).
 *
 * GET  = DRY-RUN: mostra o que seria removido e o "antes → depois" de cada
 *        participante, SEM gravar nada.
 * POST = APLICA (exige { confirm: "RESYNC" }): remove PR fantasma + excedente
 *        de feed e reconstrói total_points a partir do extrato limpo.
 *
 * Pré-requisito: rodar antes o recálculo de bioimpedância
 * (/api/admin/rankings/recalc-bio) para que o extrato de bio já esteja
 * corrigido (com a trava de sanidade). Esta rota NÃO mexe na bio.
 *
 * A lógica vive em lib/rankings/resync.ts para que preview e aplicação
 * compartilhem exatamente o mesmo código.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { previewResync, applyResync } from '@/lib/rankings/resync'

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
  if ((profile as any)?.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Apenas super admin' }, { status: 403 }) }
  }
  return { supabaseAdmin }
}

export async function GET() {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error

    const preview = await previewResync(auth.supabaseAdmin)
    return NextResponse.json({
      success: true,
      dryRun: true,
      aviso: 'Pré-visualização — nada foi gravado. Rode o recalc-bio ANTES. Para aplicar: POST { "confirm": "RESYNC" }.',
      ...preview,
    })
  } catch (error) {
    console.error('Erro no preview resync:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error

    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== 'RESYNC') {
      return NextResponse.json(
        { success: false, error: 'Envie { "confirm": "RESYNC" } para aplicar. Use GET para pré-visualizar.' },
        { status: 400 }
      )
    }

    const result = await applyResync(auth.supabaseAdmin)
    return NextResponse.json({ success: true, dryRun: false, ...result })
  } catch (error) {
    console.error('Erro ao aplicar resync:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

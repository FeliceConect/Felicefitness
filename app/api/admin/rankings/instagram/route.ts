/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const INSTAGRAM_POINTS = 5
const REASON = 'Post no Instagram com #vivendofelice'

// POST - Validar post no Instagram com #vivendofelice e atribuir 5 pts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, postUrl } = body as { clientId?: string; postUrl?: string }

    if (!clientId || !postUrl) {
      return NextResponse.json(
        { success: false, error: 'clientId e postUrl são obrigatórios' },
        { status: 400 }
      )
    }

    // Sanitiza URL do post (Instagram: https://www.instagram.com/p/<id>/ ou /reel/<id>/)
    const trimmedUrl = postUrl.trim()
    if (!/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i.test(trimmedUrl)) {
      return NextResponse.json(
        { success: false, error: 'URL inválida — informe o link do post no Instagram' },
        { status: 400 }
      )
    }

    // Dedup por URL (mesmo post nunca vale duas vezes, mesmo que admin tente)
    const { data: existing } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', clientId)
      .eq('reason', REASON)
      .ilike('notas', `%${trimmedUrl}%`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Este post já foi validado anteriormente',
      }, { status: 409 })
    }

    // Insere a transação. Usa o campo `notas` para guardar a URL (reference_id é UUID).
    const { error: insertError } = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: clientId,
        points: INSTAGRAM_POINTS,
        reason: REASON,
        category: 'social',
        source: profile.role === 'super_admin' ? 'superadmin' : 'professional',
        awarded_by: user.id,
        notas: trimmedUrl,
      })

    if (insertError) {
      console.error('Erro ao validar post Instagram:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao validar post' }, { status: 500 })
    }

    // Sincroniza com leaderboard (rankings globais)
    await supabaseAdmin.rpc('fitness_award_points_to_user', {
      p_user_id: clientId,
      p_delta: INSTAGRAM_POINTS,
      p_allowed_ranking_categories: null,
    })

    return NextResponse.json({
      success: true,
      points: INSTAGRAM_POINTS,
      message: `${INSTAGRAM_POINTS} pts atribuídos por post no Instagram`,
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

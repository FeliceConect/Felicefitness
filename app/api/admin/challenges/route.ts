/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

// GET - List all challenges for admin (including inactive, private)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()

    // Check role
    const { data: profile } = await db
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    // Get all challenges
    const { data: challenges } = await db
      .from('fitness_challenges')
      .select('*')
      .order('created_at', { ascending: false })

    // Get participant counts
    const enriched = await Promise.all((challenges || []).map(async (c) => {
      const { count } = await db
        .from('fitness_challenge_participants')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', c.id)

      return {
        ...c,
        participant_count: count || 0,
      }
    }))

    return NextResponse.json({ success: true, challenges: enriched })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Toggle challenge active/inactive
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()

    const { data: profile } = await db
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, is_active } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 })
    }

    const { error: updateError } = await db
      .from('fitness_challenges')
      .update({ is_active })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

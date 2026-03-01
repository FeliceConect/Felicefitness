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

// GET - List all point transactions for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Check admin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get recent transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erro:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    // Enrich with user names
    const userIds = [...new Set((transactions || []).map(t => t.user_id))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        userMap[p.id] = p.nome || ''
      }
    }

    const enriched = (transactions || []).map(t => ({
      ...t,
      user_name: userMap[t.user_id] || null,
    }))

    return NextResponse.json({ success: true, transactions: enriched })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

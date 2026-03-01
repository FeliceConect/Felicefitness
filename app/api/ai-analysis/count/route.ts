/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const MONTHLY_LIMIT = 15

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Count meals with AI analysis this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { count, error } = await supabaseAdmin
      .from('fitness_meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('analise_ia', 'is', null)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    if (error) {
      console.error('Erro ao contar analises:', error)
      return NextResponse.json({ success: false, error: 'Erro ao contar analises' }, { status: 500 })
    }

    const used = count || 0

    return NextResponse.json({
      success: true,
      used,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - used),
    })
  } catch (error) {
    console.error('Erro na API de contagem:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List all rankings (active and inactive) for admin
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Check admin/superadmin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { data: rankings, error } = await supabaseAdmin
      .from('fitness_rankings')
      .select('*')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar rankings:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rankings: rankings || [] })
  } catch (error) {
    console.error('Erro na API admin rankings:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

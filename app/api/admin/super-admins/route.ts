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

// GET - Lista superadmins (para filtro e atribuição de pacientes)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, display_name')
      .eq('role', 'super_admin')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar superadmins:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      superAdmins: (data || []).map(s => ({
        id: s.id,
        name: s.display_name || s.nome || 'Superadmin',
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar superadmins:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

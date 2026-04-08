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

// GET - Mapa compacto de todas as fichas: { userId: { program_name, assigned_super_admin_id, assigned_name } }
// Usado pela lista de pacientes do admin para filtro Leonardo/Marinella + badges.
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

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const { data: records, error } = await supabaseAdmin
      .from('fitness_medical_records')
      .select('user_id, program_name, program_start_date, program_duration_months, assigned_super_admin_id')

    if (error) {
      console.error('Erro ao buscar fichas:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    // Enriquece com nome do superadmin atribuído
    const adminIds = [...new Set((records || [])
      .map(r => r.assigned_super_admin_id)
      .filter(Boolean))]
    const adminNames: Record<string, string> = {}
    if (adminIds.length > 0) {
      const { data: admins } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name')
        .in('id', adminIds)
      for (const a of (admins || [])) {
        adminNames[a.id] = a.display_name || a.nome || 'Superadmin'
      }
    }

    const map: Record<string, {
      program_name: string
      program_start_date: string | null
      program_duration_months: number
      assigned_super_admin_id: string | null
      assigned_name: string | null
    }> = {}
    for (const r of (records || [])) {
      map[r.user_id] = {
        program_name: r.program_name,
        program_start_date: r.program_start_date,
        program_duration_months: r.program_duration_months,
        assigned_super_admin_id: r.assigned_super_admin_id,
        assigned_name: r.assigned_super_admin_id ? (adminNames[r.assigned_super_admin_id] || null) : null,
      }
    }

    return NextResponse.json({ success: true, map })
  } catch (error) {
    console.error('Erro ao buscar mapa de fichas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

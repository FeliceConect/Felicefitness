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

// GET - List all form assignments (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const specialty = searchParams.get('specialty')
    const clientId = searchParams.get('clientId')
    const professionalId = searchParams.get('professionalId')

    let query = supabaseAdmin
      .from('fitness_form_assignments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (status) query = query.eq('status', status)
    if (clientId) query = query.eq('client_id', clientId)
    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data: assignments, error } = await query

    if (error) {
      console.error('Erro ao buscar assignments:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar formularios' }, { status: 500 })
    }

    let filtered = assignments || []

    // Enrich with template, client and professional data
    if (filtered.length > 0) {
      const templateIds = [...new Set(filtered.map(a => a.template_id))]
      const clientIds = [...new Set(filtered.map(a => a.client_id))]
      const profIds = [...new Set(filtered.map(a => a.professional_id))]

      const [templatesResult, { data: clients }, { data: professionals }] = await Promise.all([
        supabaseAdmin
          .from('fitness_form_templates')
          .select('id, name, description, specialty, form_type')
          .in('id', templateIds),
        supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome, email')
          .in('id', clientIds),
        supabaseAdmin
          .from('fitness_professionals')
          .select('id, display_name, type, user_id')
          .in('id', profIds)
      ])

      const templateMap = new Map((templatesResult.data || []).map(t => [t.id, t]))
      const clientMap = new Map((clients || []).map(c => [c.id, c]))
      const profMap = new Map((professionals || []).map(p => [p.id, p]))

      let enriched = filtered.map(a => ({
        ...a,
        template: templateMap.get(a.template_id) || null,
        client: clientMap.get(a.client_id) || { id: a.client_id, nome: 'Cliente', email: '' },
        professional: profMap.get(a.professional_id) || null,
      }))

      // Filter by specialty from the template if needed
      if (specialty) {
        enriched = enriched.filter(a => a.template?.specialty === specialty)
      }

      return NextResponse.json({ success: true, data: enriched })
    }

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error('Erro na API admin forms:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

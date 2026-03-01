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

// GET - Listar formulários pendentes/em andamento do paciente
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Buscar assignments do paciente com dados do template e profissional
    let query = supabaseAdmin
      .from('fitness_form_assignments')
      .select(`
        *,
        template:fitness_form_templates(id, name, description, specialty, form_type)
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      // Por padrão, mostrar apenas pendentes e em preenchimento
      query = query.in('status', ['pending', 'in_progress'])
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Erro ao buscar formulários do paciente:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar formulários' }, { status: 500 })
    }

    // Enriquecer com dados dos profissionais
    if (assignments && assignments.length > 0) {
      const professionalIds = [...new Set(assignments.map(a => a.professional_id))]
      const { data: professionals } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, type')
        .in('id', professionalIds)

      const profMap = new Map((professionals || []).map(p => [p.id, p]))

      // Buscar rascunhos do paciente para cada assignment
      const assignmentIds = assignments.map(a => a.id)
      const { data: drafts } = await supabaseAdmin
        .from('fitness_form_drafts')
        .select('assignment_id, current_step, updated_at')
        .eq('client_id', user.id)
        .in('assignment_id', assignmentIds)

      const draftMap = new Map((drafts || []).map(d => [d.assignment_id, d]))

      const enriched = assignments.map(a => ({
        ...a,
        professional: profMap.get(a.professional_id) || null,
        draft: draftMap.get(a.id) || null,
      }))

      return NextResponse.json({ success: true, data: enriched })
    }

    return NextResponse.json({ success: true, data: assignments || [] })
  } catch (error) {
    console.error('Erro na API de formulários do paciente:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

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

// GET - Listar assignments do profissional (com filtros)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verificar se é profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    // Buscar assignments (sem join — evita ambiguidade de FK no PostgREST)
    let query = supabaseAdmin
      .from('fitness_form_assignments')
      .select('*')
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Erro ao buscar assignments:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar formulários enviados' }, { status: 500 })
    }

    // Enriquecer com dados dos templates e clientes
    if (assignments && assignments.length > 0) {
      const templateIds = [...new Set(assignments.map(a => a.template_id))]
      const clientIds = [...new Set(assignments.map(a => a.client_id))]

      const [templatesResult, clientsResult] = await Promise.all([
        supabaseAdmin
          .from('fitness_form_templates')
          .select('id, name, description, specialty, form_type')
          .in('id', templateIds),
        supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome, email')
          .in('id', clientIds),
      ])

      const templateMap = new Map((templatesResult.data || []).map(t => [t.id, t]))
      const clientMap = new Map((clientsResult.data || []).map(c => [c.id, c]))

      const enriched = assignments.map(a => ({
        ...a,
        template: templateMap.get(a.template_id) || null,
        client: clientMap.get(a.client_id) || { id: a.client_id, nome: 'Cliente', email: '' },
      }))

      return NextResponse.json({ success: true, data: enriched })
    }

    return NextResponse.json({ success: true, data: assignments || [] })
  } catch (error) {
    console.error('Erro na API de assignments:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

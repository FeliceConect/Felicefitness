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

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user, supabaseAdmin }
}

// Calcula o mês do programa (1..duration) a partir da data de início
function calcProgramMonth(startDate: string | null, consultDate: string): number | null {
  if (!startDate) return null
  const start = new Date(startDate)
  const consult = new Date(consultDate)
  if (isNaN(start.getTime()) || isNaN(consult.getTime())) return null
  let diff = (consult.getFullYear() - start.getFullYear()) * 12 + (consult.getMonth() - start.getMonth())
  if (consult.getDate() < start.getDate()) diff -= 1
  return diff < 0 ? 1 : diff + 1
}

// GET - Lista consultas de um paciente (mais recentes primeiro)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const auth = await requireSuperAdmin()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { data: consultations, error } = await supabaseAdmin
      .from('fitness_medical_consultations')
      .select('*')
      .eq('user_id', userId)
      .order('consultation_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar consultas:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    // Enriquece com nome de quem criou
    const creatorIds = [...new Set((consultations || []).map(c => c.created_by).filter(Boolean))]
    const creators: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name')
        .in('id', creatorIds)
      for (const p of (profiles || [])) {
        creators[p.id] = p.display_name || p.nome || 'Superadmin'
      }
    }

    const enriched = (consultations || []).map(c => ({
      ...c,
      created_by_name: creators[c.created_by] || 'Superadmin',
    }))

    return NextResponse.json({ success: true, consultations: enriched })
  } catch (error) {
    console.error('Erro ao buscar consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Cria uma nova consulta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const auth = await requireSuperAdmin()
    if ('error' in auth) return auth.error
    const { user, supabaseAdmin } = auth

    const body = await request.json()
    const consultDate = body.consultation_date || new Date().toISOString().slice(0, 10)

    // Busca a ficha para snapshot do programa + mês calculado
    const { data: record } = await supabaseAdmin
      .from('fitness_medical_records')
      .select('program_name, program_start_date')
      .eq('user_id', userId)
      .maybeSingle()

    const programName = record?.program_name || 'felice_wellness'
    const programMonth =
      body.program_month ?? calcProgramMonth(record?.program_start_date || null, consultDate)

    const insertPayload = {
      user_id: userId,
      consultation_date: consultDate,
      program_name_snapshot: programName,
      program_month: programMonth,
      consultation_type: body.consultation_type || 'acompanhamento',
      main_complaint: body.main_complaint || null,
      evolution: body.evolution || null,
      adherence: body.adherence || {},
      objective_data: body.objective_data || {},
      emotional_state: body.emotional_state ?? null,
      emotional_notes: body.emotional_notes || null,
      team_feedback: body.team_feedback || null,
      action_plan: body.action_plan || null,
      private_notes: body.private_notes || null,
      next_consultation_date: body.next_consultation_date || null,
      created_by: user.id,
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('fitness_medical_consultations')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar consulta:', error)
      return NextResponse.json({ success: false, error: 'Erro ao criar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, consultation })
  } catch (error) {
    console.error('Erro ao criar consulta:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

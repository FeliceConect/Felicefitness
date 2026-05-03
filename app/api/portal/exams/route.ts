/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List exams for a patient
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId é obrigatório' }, { status: 400 })
    }

    // Verify the user is a professional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      // Allow super_admin
      const { data: profile } = await supabaseAdmin
        .from('fitness_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!profile || profile.role !== 'super_admin') {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
      }
    }

    const { data: exams, error } = await supabaseAdmin
      .from('fitness_patient_exams')
      .select('*')
      .eq('patient_id', patientId)
      .order('exam_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar exames:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar exames' }, { status: 500 })
    }

    return NextResponse.json({ success: true, exams: exams || [] })
  } catch (error) {
    console.error('Erro na API de exames:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create exam
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { patient_id, professional_id, exam_date, exam_type, description, results, observations } = body

    if (!patient_id || !results) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios: patient_id, results' }, { status: 400 })
    }

    const { data: exam, error } = await supabaseAdmin
      .from('fitness_patient_exams')
      .insert({
        patient_id,
        professional_id: professional_id || null,
        created_by: user.id,
        exam_date: exam_date || getTodayDateSP(),
        exam_type: exam_type || 'outro',
        description: description || null,
        results,
        observations: observations || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar exame:', error)
      return NextResponse.json({ success: false, error: 'Erro ao criar exame' }, { status: 500 })
    }

    return NextResponse.json({ success: true, exam })
  } catch (error) {
    console.error('Erro na API de exames:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

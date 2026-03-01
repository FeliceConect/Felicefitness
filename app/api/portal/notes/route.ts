/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const ROLE_VISIBILITY: Record<string, string[]> = {
  coach: ['coach', 'super_admin'],
  nutritionist: ['nutritionist', 'super_admin'],
  trainer: ['trainer', 'super_admin'],
  physiotherapist: ['physiotherapist', 'super_admin'],
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List notes (filter by patient_id, note_type, appointment_id)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const noteType = searchParams.get('noteType')
    const appointmentId = searchParams.get('appointmentId')

    let query = supabaseAdmin
      .from('fitness_professional_notes')
      .select('*')
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })

    if (patientId) query = query.eq('patient_id', patientId)
    if (noteType) query = query.eq('note_type', noteType)
    if (appointmentId) query = query.eq('appointment_id', appointmentId)

    const { data: notes, error } = await query

    if (error) {
      console.error('Erro ao buscar notas:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar notas' }, { status: 500 })
    }

    return NextResponse.json({ success: true, notes: notes || [] })
  } catch (error) {
    console.error('Erro na API de notas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create note
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    const body = await request.json()
    const { patient_id, appointment_id, note_type, content } = body

    if (!patient_id || !note_type || !content) {
      return NextResponse.json(
        { success: false, error: 'patient_id, note_type e content sao obrigatorios' },
        { status: 400 }
      )
    }

    const validTypes = ['observation', 'evolution', 'action_plan', 'alert', 'consultation']
    if (!validTypes.includes(note_type)) {
      return NextResponse.json({ success: false, error: 'note_type invalido' }, { status: 400 })
    }

    // Verify patient is assigned to this professional
    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', patient_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Paciente nao esta vinculado a voce' },
        { status: 403 }
      )
    }

    const visible_to_roles = ROLE_VISIBILITY[professional.type] || ['super_admin']

    const { data: note, error: insertError } = await supabaseAdmin
      .from('fitness_professional_notes')
      .insert({
        professional_id: professional.id,
        patient_id,
        appointment_id: appointment_id || null,
        note_type,
        content,
        visible_to_roles,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar nota:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao criar nota' }, { status: 500 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Erro na API de notas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

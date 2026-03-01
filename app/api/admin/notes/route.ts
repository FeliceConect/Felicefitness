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

// GET - List all professional notes (admin only)
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
    const patientId = searchParams.get('patientId')
    const professionalId = searchParams.get('professionalId')
    const noteType = searchParams.get('noteType')

    let query = supabaseAdmin
      .from('fitness_professional_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (patientId) query = query.eq('patient_id', patientId)
    if (professionalId) query = query.eq('professional_id', professionalId)
    if (noteType) query = query.eq('note_type', noteType)

    const { data: notes, error } = await query

    if (error) {
      console.error('Erro ao buscar notas:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar notas' }, { status: 500 })
    }

    // Enrich with patient and professional data
    if (notes && notes.length > 0) {
      const patientIds = [...new Set(notes.map(n => n.patient_id))]
      const profIds = [...new Set(notes.map(n => n.professional_id))]

      const [{ data: patients }, { data: professionals }] = await Promise.all([
        supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome, email')
          .in('id', patientIds),
        supabaseAdmin
          .from('fitness_professionals')
          .select('id, display_name, type, user_id')
          .in('id', profIds)
      ])

      const patientMap = new Map((patients || []).map(p => [p.id, p]))
      const profMap = new Map((professionals || []).map(p => [p.id, p]))

      const enriched = notes.map(n => ({
        ...n,
        patient: patientMap.get(n.patient_id) || { id: n.patient_id, nome: 'Paciente', email: '' },
        professional: profMap.get(n.professional_id) || null,
      }))

      return NextResponse.json({ success: true, data: enriched })
    }

    return NextResponse.json({ success: true, data: notes || [] })
  } catch (error) {
    console.error('Erro na API admin notes:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

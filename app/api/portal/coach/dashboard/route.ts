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

export async function GET() {
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

    if (!professional || professional.type !== 'coach') {
      return NextResponse.json({ success: false, error: 'Acesso restrito a coach' }, { status: 403 })
    }

    // Count active clients
    const { count: activeClients } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professional.id)
      .eq('is_active', true)

    // Today's appointments
    const today = new Date().toISOString().split('T')[0]
    const { data: todayAppointments } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, patient_id, date, start_time, end_time, status, appointment_type')
      .eq('professional_id', professional.id)
      .eq('date', today)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    // This week's appointments
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const { count: weekAppointments } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professional.id)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', weekEnd.toISOString().split('T')[0])
      .neq('status', 'cancelled')

    // Recent notes
    const { data: recentNotes } = await supabaseAdmin
      .from('fitness_professional_notes')
      .select('id, patient_id, note_type, content, created_at')
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const { data: upcomingAppointments } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, patient_id, date, start_time, end_time, status, appointment_type')
      .eq('professional_id', professional.id)
      .gte('date', today)
      .lte('date', nextWeek.toISOString().split('T')[0])
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10)

    // Clients who need attention (no notes in 14+ days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const { data: assignments } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', professional.id)
      .eq('is_active', true)

    const clientIds = (assignments || []).map(a => a.client_id)
    const needsAttention: Array<{ id: string; name: string; lastNote: string | null }> = []

    if (clientIds.length > 0) {
      for (const clientId of clientIds) {
        const { data: lastNote } = await supabaseAdmin
          .from('fitness_professional_notes')
          .select('created_at')
          .eq('professional_id', professional.id)
          .eq('patient_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!lastNote || new Date(lastNote.created_at) < twoWeeksAgo) {
          const { data: profile } = await supabaseAdmin
            .from('fitness_profiles')
            .select('nome, email')
            .eq('id', clientId)
            .single()
          needsAttention.push({
            id: clientId,
            name: profile?.nome || profile?.email || 'Cliente',
            lastNote: lastNote?.created_at || null,
          })
        }
      }
    }

    // Enrich appointments/notes with client names
    const allPatientIds = new Set<string>()
    ;(todayAppointments || []).forEach(a => allPatientIds.add(a.patient_id))
    ;(upcomingAppointments || []).forEach(a => allPatientIds.add(a.patient_id))
    ;(recentNotes || []).forEach(n => allPatientIds.add(n.patient_id))

    const clientMap: Record<string, string> = {}
    if (allPatientIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', Array.from(allPatientIds))
      for (const p of profiles || []) {
        clientMap[p.id] = p.nome || p.email || 'Cliente'
      }
    }

    const enrichAppointment = (a: Record<string, unknown>) => ({
      ...a,
      patient_name: clientMap[a.patient_id as string] || 'Cliente',
    })

    const enrichNote = (n: Record<string, unknown>) => ({
      ...n,
      patient_name: clientMap[n.patient_id as string] || 'Cliente',
      preview: ((n.content as string) || '').substring(0, 100),
    })

    return NextResponse.json({
      success: true,
      stats: {
        activeClients: activeClients || 0,
        todayAppointments: (todayAppointments || []).length,
        weekAppointments: weekAppointments || 0,
        recentNotesCount: (recentNotes || []).length,
      },
      todayAppointments: (todayAppointments || []).map(enrichAppointment),
      upcomingAppointments: (upcomingAppointments || []).map(enrichAppointment),
      recentNotes: (recentNotes || []).map(enrichNote),
      needsAttention,
    })
  } catch (error) {
    console.error('Erro no dashboard coach:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

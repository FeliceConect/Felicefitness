import { getSupabase, getCurrentUserId, ServiceError } from './base'
import { getTodayDateSP } from '@/lib/utils/date'
import type {
  Appointment,
  AppointmentWithDetails,
  AppointmentFilters,
  ServiceType,
} from '@/types/appointments'
import { SERVICE_TYPE_LABELS } from '@/types/appointments'

// ============================================
// PACIENTE — Consultas do próprio paciente
// ============================================

export async function getPatientAppointments(
  filters?: AppointmentFilters
): Promise<AppointmentWithDetails[]> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  let query = supabase
    .from('fitness_appointments')
    .select('*')
    .eq('patient_id', userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw new ServiceError('Erro ao buscar consultas', error.code, error.message)

  return enrichAppointments(supabase, (data ?? []) as Appointment[])
}

export async function getNextAppointment(): Promise<AppointmentWithDetails | null> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  const today = getTodayDateSP()

  const { data, error } = await supabase
    .from('fitness_appointments')
    .select('*')
    .eq('patient_id', userId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)

  if (error) throw new ServiceError('Erro ao buscar próxima consulta', error.code, error.message)

  if (!data || data.length === 0) return null

  const enriched = await enrichAppointments(supabase, data as Appointment[])
  return enriched[0] || null
}

// ============================================
// PROFISSIONAL — Consultas do profissional
// ============================================

export async function getProfessionalAppointments(
  filters?: AppointmentFilters
): Promise<AppointmentWithDetails[]> {
  const supabase = getSupabase()

  // RLS handles filtering by professional's user_id
  let query = supabase
    .from('fitness_appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw new ServiceError('Erro ao buscar consultas', error.code, error.message)

  return enrichAppointments(supabase, (data ?? []) as Appointment[], true)
}

// ============================================
// AÇÕES DO PACIENTE
// ============================================

export async function confirmAppointment(appointmentId: string): Promise<Appointment> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_appointments')
    .update({
      confirmed_by_patient: true,
      confirmed_at: new Date().toISOString(),
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('patient_id', userId)
    .select()
    .single()

  if (error) throw new ServiceError('Erro ao confirmar consulta', error.code, error.message)
  return data as Appointment
}

export async function requestReschedule(
  appointmentId: string,
  reason: string
): Promise<Appointment> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_appointments')
    .update({
      status: 'reschedule_requested',
      reschedule_reason: reason,
      reschedule_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('patient_id', userId)
    .select()
    .single()

  if (error) throw new ServiceError('Erro ao solicitar reagendamento', error.code, error.message)
  return data as Appointment
}

// ============================================
// HELPERS
// ============================================

async function enrichAppointments(
  supabase: ReturnType<typeof getSupabase>,
  appointments: Appointment[],
  includePatient = false
): Promise<AppointmentWithDetails[]> {
  if (appointments.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Buscar profissionais (apenas appointments com professional_id setado;
  // appointments de serviço não têm um e usam service_type como label)
  const professionalIds = Array.from(
    new Set(appointments.map(a => a.professional_id).filter(Boolean) as string[])
  )

  let profMap = new Map<string, { id: string; display_name: string; type: string }>()
  if (professionalIds.length > 0) {
    const { data: professionals } = await sb
      .from('fitness_professionals')
      .select('id, display_name, type')
      .in('id', professionalIds)

    profMap = new Map<string, { id: string; display_name: string; type: string }>(
      (professionals || []).map((p: { id: string; display_name: string; type: string }) => [p.id, p])
    )
  }

  // Buscar pacientes se necessário
  let patientMap = new Map<string, { nome: string; email: string }>()
  if (includePatient) {
    const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))
    const { data: patients } = await sb
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', patientIds)

    patientMap = new Map<string, { nome: string; email: string }>(
      (patients || []).map((p: { id: string; nome: string; email: string }) => [p.id, { nome: p.nome || 'Paciente', email: p.email || '' }])
    )
  }

  return appointments.map(a => {
    const prof = a.professional_id ? profMap.get(a.professional_id) : null
    const patient = includePatient ? patientMap.get(a.patient_id) : undefined
    const serviceLabel = a.service_type && a.service_type in SERVICE_TYPE_LABELS
      ? SERVICE_TYPE_LABELS[a.service_type as ServiceType]
      : null

    return {
      ...a,
      professional_name: prof?.display_name || serviceLabel || 'Profissional',
      professional_type: prof?.type || null,
      ...(patient && {
        patient_name: patient.nome,
        patient_email: patient.email,
      }),
    }
  }) as AppointmentWithDetails[]
}

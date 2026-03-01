// Complexo Wellness - Tipos para Sistema de Agenda/Consultas

// ============================================
// TIPOS DE CONSULTA E STATUS
// ============================================

export type AppointmentType = 'presencial' | 'online'

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  presencial: 'Presencial',
  online: 'Online',
}

export const APPOINTMENT_TYPE_ICONS: Record<AppointmentType, string> = {
  presencial: 'MapPin',
  online: 'Video',
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'reschedule_requested'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'Não compareceu',
  reschedule_requested: 'Reagendamento solicitado',
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-dourado/15 text-dourado',
  confirmed: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-error/15 text-error',
  no_show: 'bg-error/15 text-error',
  reschedule_requested: 'bg-yellow-500/15 text-yellow-600',
}

// ============================================
// TIPO DO PROFISSIONAL
// ============================================

export type ProfessionalType = 'nutritionist' | 'trainer' | 'coach'

export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  nutritionist: 'Nutricionista',
  trainer: 'Personal Trainer',
  coach: 'Coach',
}

// ============================================
// ENTIDADE PRINCIPAL
// ============================================

export interface Appointment {
  id: string
  patient_id: string
  professional_id: string
  appointment_type: AppointmentType
  meeting_link: string | null
  date: string // DATE (YYYY-MM-DD)
  start_time: string // TIME (HH:MM:SS)
  end_time: string // TIME (HH:MM:SS)
  location: string | null
  status: AppointmentStatus
  reschedule_reason: string | null
  reschedule_requested_at: string | null
  notes: string | null
  confirmed_by_patient: boolean
  confirmed_at: string | null
  ics_data: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================
// TIPOS COMPOSTOS (com joins)
// ============================================

export interface AppointmentWithDetails extends Appointment {
  professional_name: string
  professional_type: ProfessionalType
  patient_name?: string
  patient_email?: string
}

// ============================================
// PAYLOADS DE API
// ============================================

export interface CreateAppointmentInput {
  patient_id: string
  professional_id: string
  appointment_type: AppointmentType
  meeting_link?: string
  date: string
  start_time: string
  end_time: string
  location?: string
  notes?: string
}

export interface UpdateAppointmentInput {
  appointment_type?: AppointmentType
  meeting_link?: string | null
  date?: string
  start_time?: string
  end_time?: string
  location?: string | null
  status?: AppointmentStatus
  notes?: string | null
}

export interface RescheduleRequestInput {
  reason: string
}

// ============================================
// FILTROS
// ============================================

export interface AppointmentFilters {
  status?: AppointmentStatus | AppointmentStatus[]
  dateFrom?: string
  dateTo?: string
  professionalId?: string
  appointmentType?: AppointmentType
  limit?: number
}

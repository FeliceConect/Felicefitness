import { createEvent, type EventAttributes } from 'ics'
import type { AppointmentWithDetails } from '@/types/appointments'
import { PROFESSIONAL_TYPE_LABELS } from '@/types/appointments'

/**
 * Gera uma string ICS a partir de uma consulta.
 * Retorna a string do arquivo .ics pronto para download.
 */
export function generateAppointmentICS(appointment: AppointmentWithDetails): string {
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [startH, startM] = appointment.start_time.split(':').map(Number)
  const [endH, endM] = appointment.end_time.split(':').map(Number)

  const profType = PROFESSIONAL_TYPE_LABELS[appointment.professional_type] || 'Profissional'
  const title = `Consulta - ${appointment.professional_name} (${profType})`

  const description = [
    `Consulta com ${appointment.professional_name}`,
    `Tipo: ${profType}`,
    appointment.appointment_type === 'online' && appointment.meeting_link
      ? `Link: ${appointment.meeting_link}`
      : null,
    appointment.notes ? `Notas: ${appointment.notes}` : null,
    '',
    'Complexo Wellness',
  ]
    .filter(Boolean)
    .join('\n')

  const location =
    appointment.appointment_type === 'online'
      ? appointment.meeting_link || 'Online'
      : appointment.location || 'Complexo Felice'

  const event: EventAttributes = {
    start: [year, month, day, startH, startM],
    startInputType: 'local',
    startOutputType: 'local',
    end: [year, month, day, endH, endM],
    endInputType: 'local',
    endOutputType: 'local',
    title,
    description,
    location,
    uid: `appointment-${appointment.id}@complexowellness`,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    calName: 'Complexo Wellness',
    organizer: { name: 'Complexo Wellness', email: 'contato@complexofelice.com.br' },
    alarms: [
      { action: 'display', trigger: { hours: 1, before: true }, description: 'Consulta em 1 hora' },
      { action: 'display', trigger: { minutes: 15, before: true }, description: 'Consulta em 15 minutos' },
    ],
  }

  const { error, value } = createEvent(event)

  if (error) {
    console.error('Erro ao gerar ICS:', error)
    throw new Error('Não foi possível gerar o arquivo de calendário')
  }

  return value || ''
}

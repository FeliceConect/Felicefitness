'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Check,
  CalendarPlus,
  RefreshCcw,
  ExternalLink,
  Award,
} from 'lucide-react'
import type { AppointmentWithDetails } from '@/types/appointments'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  PROFESSIONAL_TYPE_LABELS,
} from '@/types/appointments'
import { RescheduleModal } from './reschedule-modal'

interface AppointmentCardProps {
  appointment: AppointmentWithDetails
  onConfirm?: (id: string) => Promise<void>
  onReschedule?: (id: string, reason: string) => Promise<void>
  isHistory?: boolean
}

export function AppointmentCard({
  appointment,
  onConfirm,
  onReschedule,
  isHistory = false,
}: AppointmentCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  const profType = PROFESSIONAL_TYPE_LABELS[appointment.professional_type] || 'Profissional'
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status]
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status]

  // Formatar data
  const dateObj = new Date(appointment.date + 'T12:00:00')
  const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  const startTime = appointment.start_time.slice(0, 5)
  const endTime = appointment.end_time.slice(0, 5)

  // Verificar se está dentro de 15min para link online
  const now = new Date()
  const appointmentStart = new Date(`${appointment.date}T${appointment.start_time}`)
  const minutesBefore = (appointmentStart.getTime() - now.getTime()) / (1000 * 60)
  const canJoin = appointment.appointment_type === 'online' && appointment.meeting_link && minutesBefore <= 15 && minutesBefore > -60

  const canConfirm = appointment.status === 'scheduled' && !isHistory
  const canReschedule = ['scheduled', 'confirmed'].includes(appointment.status) && !isHistory

  const handleConfirm = async () => {
    if (!onConfirm) return
    setConfirming(true)
    try {
      await onConfirm(appointment.id)
    } finally {
      setConfirming(false)
    }
  }

  const handleDownloadICS = () => {
    window.open(`/api/appointments/${appointment.id}/ics`, '_blank')
  }

  return (
    <>
      <div className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
        isHistory ? 'border-border opacity-80' : 'border-border hover:border-dourado/30 hover:shadow-md'
      }`}>
        {/* Header: Profissional + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              appointment.status === 'completed'
                ? 'bg-success/10'
                : 'bg-dourado/10'
            }`}>
              {appointment.status === 'completed' ? (
                <Check className="w-5 h-5 text-success" />
              ) : appointment.appointment_type === 'online' ? (
                <Video className="w-5 h-5 text-dourado" />
              ) : (
                <MapPin className="w-5 h-5 text-dourado" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{appointment.professional_name}</p>
              <p className="text-xs text-foreground-muted">{profType}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Data e Hora */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <Calendar className="w-4 h-4 text-foreground-muted" />
            <span className="capitalize">{dateFormatted}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <Clock className="w-4 h-4 text-foreground-muted" />
            <span>{startTime} - {endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            {appointment.appointment_type === 'online' ? (
              <>
                <Video className="w-4 h-4 text-foreground-muted" />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-foreground-muted" />
                <span>{appointment.location || 'Complexo Felice'}</span>
              </>
            )}
          </div>
        </div>

        {/* Pontos se realizada */}
        {appointment.status === 'completed' && (
          <div className="flex items-center gap-1.5 mb-3 text-sm text-dourado font-medium">
            <Award className="w-4 h-4" />
            <span>+20 pts</span>
          </div>
        )}

        {/* Motivo de reagendamento se houver */}
        {appointment.status === 'reschedule_requested' && appointment.reschedule_reason && (
          <div className="mb-3 p-2.5 rounded-xl bg-yellow-50 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              <strong>Motivo:</strong> {appointment.reschedule_reason}
            </p>
          </div>
        )}

        {/* Ações */}
        {!isHistory && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {confirming ? 'Confirmando...' : 'Confirmar'}
              </button>
            )}

            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dourado/10 text-dourado text-xs font-medium hover:bg-dourado/20 transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Calendário
            </button>

            {canJoin && (
              <a
                href={appointment.meeting_link!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vinho/10 text-vinho text-xs font-medium hover:bg-vinho/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Entrar
              </a>
            )}

            {canReschedule && (
              <button
                onClick={() => setShowReschedule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-elevated text-foreground-secondary text-xs font-medium hover:bg-border transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reagendar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Reagendamento */}
      <RescheduleModal
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        onSubmit={async (reason) => {
          if (onReschedule) {
            await onReschedule(appointment.id, reason)
          }
          setShowReschedule(false)
        }}
        professionalName={appointment.professional_name}
        date={dateFormatted}
        time={startTime}
      />
    </>
  )
}

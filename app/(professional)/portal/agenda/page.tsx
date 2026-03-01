'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  Check,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
} from 'lucide-react'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
} from '@/types/appointments'
import type { AppointmentStatus } from '@/types/appointments'

interface ProfessionalAppointment {
  id: string
  patient_id: string
  patient_name: string
  patient_email: string
  appointment_type: 'presencial' | 'online'
  meeting_link: string | null
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: AppointmentStatus
  confirmed_by_patient: boolean
  notes: string | null
  reschedule_reason: string | null
  pending_forms: number
}

export default function ProfessionalAgendaPage() {
  const [appointments, setAppointments] = useState<ProfessionalAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'past'>('upcoming')

  const today = new Date().toISOString().split('T')[0]

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filter === 'today') {
        params.set('dateFrom', today)
        params.set('dateTo', today)
      } else if (filter === 'upcoming') {
        params.set('dateFrom', today)
        params.set('status', 'scheduled,confirmed,reschedule_requested')
      } else {
        params.set('status', 'completed,cancelled,no_show')
      }

      const res = await fetch(`/api/professional/appointments?${params.toString()}`)
      const data = await res.json()
      if (data.success) setAppointments(data.data || [])
    } catch (err) {
      console.error('Erro ao buscar consultas:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, today])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/complete`, { method: 'POST' })
      const data = await res.json()
      if (data.success) await fetchAppointments()
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  const handleNoShow = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'no_show' }),
      })
      const data = await res.json()
      if (data.success) await fetchAppointments()
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-dourado" />
          Agenda
        </h1>
        <p className="text-foreground-secondary text-sm mt-1">Suas consultas agendadas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'today' as const, label: 'Hoje' },
          { key: 'upcoming' as const, label: 'Próximas' },
          { key: 'past' as const, label: 'Realizadas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-dourado text-white'
                : 'bg-white border border-border text-foreground-secondary hover:bg-background-elevated'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-5 w-40 bg-background-elevated rounded mb-2" />
              <div className="h-4 w-32 bg-background-elevated rounded mb-2" />
              <div className="h-4 w-28 bg-background-elevated rounded" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h3 className="font-heading font-bold text-foreground mb-1">
            {filter === 'today' ? 'Nenhuma consulta hoje' : filter === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhuma consulta passada'}
          </h3>
          <p className="text-sm text-foreground-secondary">
            {filter === 'upcoming' ? 'A equipe administrativa agendará suas consultas.' : 'Consultas aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const dateObj = new Date(apt.date + 'T12:00:00')
            const dateStr = dateObj.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })
            const startTime = apt.start_time.slice(0, 5)
            const endTime = apt.end_time.slice(0, 5)
            const canAction = ['scheduled', 'confirmed', 'reschedule_requested'].includes(apt.status)

            return (
              <div
                key={apt.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm ${
                  apt.status === 'reschedule_requested' ? 'border-yellow-300' : 'border-border'
                }`}
              >
                {/* Patient + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-dourado/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-dourado" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{apt.patient_name}</p>
                      <p className="text-xs text-foreground-muted">{apt.patient_email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${APPOINTMENT_STATUS_COLORS[apt.status]}`}>
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Calendar className="w-4 h-4 text-foreground-muted" />
                    <span className="capitalize">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    <span>{startTime} - {endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    {apt.appointment_type === 'online' ? (
                      <><Video className="w-4 h-4 text-foreground-muted" /><span>Online</span></>
                    ) : (
                      <><MapPin className="w-4 h-4 text-foreground-muted" /><span>{apt.location || 'Complexo Felice'}</span></>
                    )}
                  </div>
                </div>

                {/* Reagendamento reason */}
                {apt.status === 'reschedule_requested' && apt.reschedule_reason && (
                  <div className="mb-3 p-2.5 rounded-xl bg-yellow-50 border border-yellow-200">
                    <p className="text-xs text-yellow-700">
                      <strong>Motivo do reagendamento:</strong> {apt.reschedule_reason}
                    </p>
                  </div>
                )}

                {/* Pending forms badge */}
                {apt.pending_forms > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <Link
                      href="/portal/forms"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-vinho/10 text-vinho text-xs font-medium hover:bg-vinho/20 transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      {apt.pending_forms} formulário(s) pendente(s)
                    </Link>
                  </div>
                )}

                {/* Confirmed badge */}
                {apt.confirmed_by_patient && apt.status !== 'completed' && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-success">
                    <Check className="w-3.5 h-3.5" />
                    Paciente confirmou presença
                  </div>
                )}

                {/* Actions */}
                {canAction && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleComplete(apt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Realizada
                    </button>
                    <button
                      onClick={() => handleNoShow(apt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Não compareceu
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

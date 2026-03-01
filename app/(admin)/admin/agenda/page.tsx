'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Plus,
  Filter,
  X,
  Search,
  MapPin,
  Video,
  Clock,
  User,
  Stethoscope,
  Check,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import type { AppointmentWithDetails, AppointmentStatus, AppointmentType } from '@/types/appointments'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS, PROFESSIONAL_TYPE_LABELS } from '@/types/appointments'

export default function AdminAgendaPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProfessional, setFilterProfessional] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterProfessional) params.set('professionalId', filterProfessional)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)

      const res = await fetch(`/api/appointments/admin?${params.toString()}`)
      const data = await res.json()
      if (data.success) setAppointments(data.data || [])
    } catch (err) {
      console.error('Erro ao buscar consultas:', err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterProfessional, filterDateFrom, filterDateTo])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      if (status === 'cancelled') {
        const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) await fetchAppointments()
      } else if (status === 'completed') {
        const res = await fetch(`/api/appointments/${id}/complete`, { method: 'POST' })
        const data = await res.json()
        if (data.success) await fetchAppointments()
      } else {
        const res = await fetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        const data = await res.json()
        if (data.success) await fetchAppointments()
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  // Count reschedule requests
  const rescheduleCount = appointments.filter(a => a.status === 'reschedule_requested').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-foreground-secondary text-sm">Gerencie consultas e agendamentos</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-foreground rounded-xl hover:bg-dourado/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Consulta
        </button>
      </div>

      {/* Reschedule Alert */}
      {rescheduleCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            <strong>{rescheduleCount}</strong> solicitação(ões) de reagendamento pendente(s)
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            showFilters ? 'bg-dourado text-foreground' : 'bg-background-elevated text-foreground-muted hover:bg-border'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
        {(filterStatus || filterProfessional || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterStatus('')
              setFilterProfessional('')
              setFilterDateFrom('')
              setFilterDateTo('')
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-background-elevated text-foreground-muted hover:bg-border text-sm"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white rounded-xl">
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
            >
              <option value="">Todos</option>
              <option value="scheduled">Agendada</option>
              <option value="confirmed">Confirmada</option>
              <option value="reschedule_requested">Reagendamento</option>
              <option value="completed">Realizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">Não compareceu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">Data início</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
            />
          </div>
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">Data fim</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAppointments}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-dourado text-foreground rounded-lg text-sm hover:bg-dourado/90"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dourado mx-auto"></div>
            <p className="text-foreground-secondary text-sm mt-3">Carregando consultas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-secondary">Nenhuma consulta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-foreground-secondary font-medium px-4 py-3">Paciente</th>
                  <th className="text-left text-xs text-foreground-secondary font-medium px-4 py-3">Profissional</th>
                  <th className="text-left text-xs text-foreground-secondary font-medium px-4 py-3">Data/Hora</th>
                  <th className="text-left text-xs text-foreground-secondary font-medium px-4 py-3">Tipo</th>
                  <th className="text-left text-xs text-foreground-secondary font-medium px-4 py-3">Status</th>
                  <th className="text-right text-xs text-foreground-secondary font-medium px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const dateObj = new Date(apt.date + 'T12:00:00')
                  const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  const startTime = apt.start_time.slice(0, 5)

                  return (
                    <tr key={apt.id} className={`border-b border-border/50 hover:bg-background-elevated/30 ${
                      apt.status === 'reschedule_requested' ? 'bg-yellow-500/5' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-foreground-muted" />
                          <div>
                            <p className="text-sm text-foreground">{apt.patient_name || 'Paciente'}</p>
                            <p className="text-xs text-foreground-muted">{apt.patient_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-foreground-muted" />
                          <div>
                            <p className="text-sm text-foreground">{apt.professional_name}</p>
                            <p className="text-xs text-foreground-muted">{PROFESSIONAL_TYPE_LABELS[apt.professional_type]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-foreground-muted" />
                          <span className="text-sm text-foreground">{dateStr} às {startTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {apt.appointment_type === 'online' ? (
                            <Video className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-green-400" />
                          )}
                          <span className="text-sm text-foreground-muted">
                            {apt.appointment_type === 'online' ? 'Online' : 'Presencial'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${APPOINTMENT_STATUS_COLORS[apt.status]}`}>
                          {APPOINTMENT_STATUS_LABELS[apt.status]}
                        </span>
                        {apt.status === 'reschedule_requested' && apt.reschedule_reason && (
                          <p className="text-xs text-yellow-400 mt-1 max-w-[200px] truncate" title={apt.reschedule_reason}>
                            {apt.reschedule_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {['scheduled', 'confirmed', 'reschedule_requested'].includes(apt.status) && (
                            <>
                              <button
                                onClick={() => handleStatusChange(apt.id, 'completed')}
                                title="Marcar como realizada"
                                className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(apt.id, 'no_show')}
                                title="Não compareceu"
                                className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                title="Cancelar"
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchAppointments()
          }}
        />
      )}
    </div>
  )
}

// ====================================
// Create Appointment Modal
// ====================================

function CreateAppointmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('presencial')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('Complexo Felice')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load options
  const [patients, setPatients] = useState<Array<{ id: string; nome: string; email: string }>>([])
  const [professionals, setProfessionals] = useState<Array<{ id: string; display_name: string; type: string }>>([])
  const [searchPatient, setSearchPatient] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        // Load all professionals
        const profResp = await fetch('/api/professional/list').catch(() => null)
        if (profResp) {
          const profData = await profResp.json()
          if (profData.success && profData.data) {
            setProfessionals(profData.data)
          }
        }

        // Load all clients
        const clientResp = await fetch('/api/professional/clients?all=true').catch(() => null)
        if (clientResp) {
          const clientData = await clientResp.json()
          if (clientData.success && clientData.data) {
            setPatients(clientData.data.map((c: { client_id: string; client_name: string; client_email: string }) => ({
              id: c.client_id,
              nome: c.client_name,
              email: c.client_email,
            })))
          }
        }
      } catch {
        // Silently fail — data loading is best-effort
      }
    }
    loadData()
  }, [])

  const handleSubmit = async () => {
    if (!patientId || !professionalId || !date || !startTime || !endTime) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          professional_id: professionalId,
          appointment_type: appointmentType,
          date,
          start_time: startTime,
          end_time: endTime,
          location: appointmentType === 'presencial' ? location : undefined,
          meeting_link: appointmentType === 'online' ? meetingLink : undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onCreated()
      } else {
        setError(data.error || 'Erro ao criar consulta')
      }
    } catch {
      setError('Erro ao criar consulta')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPatients = searchPatient
    ? patients.filter(p =>
        p.nome?.toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchPatient.toLowerCase())
      )
    : patients

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dourado" />
            Nova Consulta
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Paciente */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Paciente *</label>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border mb-1"
            />
            {searchPatient && filteredPatients.length > 0 && !patientId && (
              <div className="bg-background-elevated rounded-lg border border-border max-h-32 overflow-y-auto">
                {filteredPatients.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPatientId(p.id)
                      setSearchPatient(p.nome || p.email)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-border transition-colors"
                  >
                    {p.nome || 'Sem nome'} <span className="text-foreground-secondary">({p.email})</span>
                  </button>
                ))}
              </div>
            )}
            {patientId && (
              <button
                onClick={() => { setPatientId(''); setSearchPatient('') }}
                className="text-xs text-dourado hover:underline"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Profissional *</label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
            >
              <option value="">Selecione...</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.display_name} ({PROFESSIONAL_TYPE_LABELS[p.type as keyof typeof PROFESSIONAL_TYPE_LABELS] || p.type})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAppointmentType('presencial')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  appointmentType === 'presencial'
                    ? 'bg-dourado text-foreground'
                    : 'bg-background-elevated text-foreground-muted hover:bg-border'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Presencial
              </button>
              <button
                onClick={() => setAppointmentType('online')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  appointmentType === 'online'
                    ? 'bg-dourado text-foreground'
                    : 'bg-background-elevated text-foreground-muted hover:bg-border'
                }`}
              >
                <Video className="w-4 h-4" />
                Online
              </button>
            </div>
          </div>

          {/* Data e horários */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Data *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Início *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Fim *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
              />
            </div>
          </div>

          {/* Local ou Link */}
          {appointmentType === 'presencial' ? (
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Local</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Complexo Felice"
                className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Link da reunião</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border"
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações sobre a consulta..."
              className="w-full rounded-lg bg-background-elevated text-foreground text-sm px-3 py-2 border border-border resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-dourado text-foreground font-medium text-sm hover:bg-dourado/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Criando...' : 'Criar Consulta'}
          </button>
        </div>
      </div>
    </div>
  )
}

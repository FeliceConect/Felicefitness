'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  Users,
  CalendarDays,
  FileText,
  ChevronRight,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface DashboardData {
  stats: {
    activeClients: number
    todayAppointments: number
    weekAppointments: number
    recentNotesCount: number
  }
  todayAppointments: Array<{
    id: string
    patient_name: string
    date: string
    start_time: string
    end_time: string
    status: string
    appointment_type: string
  }>
  upcomingAppointments: Array<{
    id: string
    patient_name: string
    date: string
    start_time: string
    end_time: string
    status: string
    appointment_type: string
  }>
  recentNotes: Array<{
    id: string
    patient_name: string
    note_type: string
    preview: string
    created_at: string
  }>
  needsAttention: Array<{
    id: string
    name: string
    lastNote: string | null
  }>
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  observation: 'Observacao',
  evolution: 'Evolucao',
  action_plan: 'Plano de Acao',
  alert: 'Alerta',
}

export default function CoachPortalPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/coach/dashboard')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const formatTime = (time: string) => time?.substring(0, 5)

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays}d atras`
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-background-elevated rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-vinho" />
          Coach Alta Performance
        </h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Acompanhamento e prontuario dos seus pacientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Pacientes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.activeClients || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-vinho/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-vinho" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Consultas Hoje</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.todayAppointments || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-dourado/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-dourado" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Semana</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.weekAppointments || 0}</p>
              <p className="text-xs text-foreground-muted">consultas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Notas Recentes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.recentNotesCount || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-dourado" />
              Proximas Consultas
            </h2>
            <Link href="/portal/agenda" className="text-sm text-dourado hover:text-dourado/80 flex items-center gap-1">
              Ver agenda <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {(data?.upcomingAppointments || []).length === 0 ? (
              <p className="text-center text-foreground-secondary py-6 text-sm">Nenhuma consulta agendada</p>
            ) : (
              <div className="space-y-3">
                {data?.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 bg-background-elevated rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-vinho/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-vinho font-medium text-sm">
                        {apt.patient_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{apt.patient_name}</p>
                      <p className="text-xs text-foreground-secondary">
                        {formatDate(apt.date)} | {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                      apt.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmada' :
                       apt.status === 'completed' ? 'Realizada' : 'Agendada'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Precisam de Atencao
            </h2>
            <p className="text-xs text-foreground-muted mt-1">Sem nota ha 14+ dias</p>
          </div>
          <div className="p-4">
            {(data?.needsAttention || []).length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-foreground-secondary text-sm">Todos os pacientes acompanhados!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.needsAttention.map((client) => (
                  <Link
                    key={client.id}
                    href={`/portal/clients/${client.id}`}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600 font-medium text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-amber-600">
                        {client.lastNote ? `Ultima nota: ${formatRelativeDate(client.lastNote)}` : 'Sem notas'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-muted" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-white border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Notas Recentes
          </h2>
          <Link href="/portal/notes" className="text-sm text-dourado hover:text-dourado/80 flex items-center gap-1">
            Ver prontuario <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4">
          {(data?.recentNotes || []).length === 0 ? (
            <p className="text-center text-foreground-secondary py-6 text-sm">Nenhuma nota registrada</p>
          ) : (
            <div className="space-y-3">
              {data?.recentNotes.map((note) => (
                <div key={note.id} className="p-3 bg-background-elevated rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{note.patient_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-vinho/10 text-vinho">
                        {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-muted">{formatRelativeDate(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary truncate">{note.preview}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border rounded-xl p-4">
        <h2 className="font-semibold text-foreground mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/portal/clients"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-elevated hover:bg-border transition-colors"
          >
            <Users className="w-6 h-6 text-vinho" />
            <span className="text-sm text-foreground-secondary text-center">Pacientes</span>
          </Link>
          <Link
            href="/portal/notes"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-elevated hover:bg-border transition-colors"
          >
            <FileText className="w-6 h-6 text-blue-500" />
            <span className="text-sm text-foreground-secondary text-center">Prontuario</span>
          </Link>
          <Link
            href="/portal/agenda"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-elevated hover:bg-border transition-colors"
          >
            <CalendarDays className="w-6 h-6 text-dourado" />
            <span className="text-sm text-foreground-secondary text-center">Agenda</span>
          </Link>
          <Link
            href="/portal/forms"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-elevated hover:bg-border transition-colors"
          >
            <Brain className="w-6 h-6 text-emerald-500" />
            <span className="text-sm text-foreground-secondary text-center">Formularios</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

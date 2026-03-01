"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  CalendarDays
} from 'lucide-react'
import {
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
  FORM_TYPE_LABELS,
  FORM_SPECIALTY_LABELS,
  type FormAssignmentStatus,
  type FormSpecialty,
  type FormType
} from '@/types/forms'

interface AssignmentData {
  id: string
  template_id: string
  template_version: number
  professional_id: string
  client_id: string
  status: FormAssignmentStatus
  due_date: string | null
  sent_at: string
  started_at: string | null
  completed_at: string | null
  reminder_sent: boolean
  notes: string | null
  created_at: string
  updated_at: string
  template: {
    id: string
    name: string
    description: string | null
    specialty: FormSpecialty
    form_type: FormType
  } | null
  client: {
    id: string
    nome: string
    email: string
  }
  professional: {
    id: string
    display_name: string
    type: string
    user_id: string
  } | null
}

const STATUS_ICONS: Record<FormAssignmentStatus, typeof Clock> = {
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  expired: AlertCircle,
}

function getProfessionalTypeBadge(type: string) {
  switch (type) {
    case 'nutritionist':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'trainer':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'coach':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-background-elevated text-foreground-muted border-border'
  }
}

function getProfessionalTypeLabel(type: string) {
  switch (type) {
    case 'nutritionist':
      return 'Nutricionista'
    case 'trainer':
      return 'Personal'
    case 'coach':
      return 'Coach'
    default:
      return type
  }
}

export default function AdminFormulariosPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (specialtyFilter) params.append('specialty', specialtyFilter)

      const response = await fetch(`/api/admin/forms?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssignments(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar formularios:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, specialtyFilter])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const filteredAssignments = assignments.filter((a) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      a.client?.nome?.toLowerCase().includes(searchLower) ||
      a.client?.email?.toLowerCase().includes(searchLower) ||
      a.template?.name?.toLowerCase().includes(searchLower) ||
      a.professional?.display_name?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Stats
  const totalCount = assignments.length
  const pendingCount = assignments.filter(a => a.status === 'pending').length
  const completedCount = assignments.filter(a => a.status === 'completed').length
  const expiredCount = assignments.filter(a => a.status === 'expired').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Formularios</h1>
        <p className="text-foreground-secondary">Formularios preenchidos pelos pacientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-foreground-secondary text-xs uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-yellow-400 text-xs uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-green-400 text-xs uppercase tracking-wider">Preenchidos</p>
          <p className="text-2xl font-bold text-foreground mt-1">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-red-400 text-xs uppercase tracking-wider">Expirados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{expiredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente, formulario ou profissional..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50 appearance-none cursor-pointer"
            >
              <option value="">Todos os status</option>
              <option value="pending">{FORM_STATUS_LABELS.pending}</option>
              <option value="in_progress">{FORM_STATUS_LABELS.in_progress}</option>
              <option value="completed">{FORM_STATUS_LABELS.completed}</option>
              <option value="expired">{FORM_STATUS_LABELS.expired}</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50 appearance-none cursor-pointer"
            >
              <option value="">Todas especialidades</option>
              <option value="nutritionist">{FORM_SPECIALTY_LABELS.nutritionist}</option>
              <option value="trainer">{FORM_SPECIALTY_LABELS.trainer}</option>
              <option value="coach">{FORM_SPECIALTY_LABELS.coach}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          /* Loading Skeleton */
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-background-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-background-elevated rounded w-1/3" />
                    <div className="h-3 bg-background-elevated rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-background-elevated rounded w-20" />
                      <div className="h-5 bg-background-elevated rounded w-24" />
                    </div>
                  </div>
                  <div className="h-8 bg-background-elevated rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 text-foreground-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhum formulario encontrado</p>
            <p className="text-sm text-foreground-muted mt-1">
              {search || statusFilter || specialtyFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhum formulario foi enviado ainda'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-elevated">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Formulario
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Profissional
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Prazo
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Preenchido em
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssignments.map((assignment) => {
                    const StatusIcon = STATUS_ICONS[assignment.status]
                    return (
                      <tr key={assignment.id} className="hover:bg-background-elevated">
                        {/* Patient */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-dourado/20 flex items-center justify-center">
                              <span className="text-dourado font-medium text-sm">
                                {assignment.client?.nome?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium text-sm">
                                {assignment.client?.nome || 'Cliente'}
                              </p>
                              <p className="text-xs text-foreground-muted">
                                {assignment.client?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Template */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-foreground text-sm">
                              {assignment.template?.name || 'Formulario'}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {assignment.template?.form_type
                                ? FORM_TYPE_LABELS[assignment.template.form_type]
                                : '-'}
                            </p>
                          </div>
                        </td>

                        {/* Professional */}
                        <td className="px-6 py-4">
                          {assignment.professional ? (
                            <div className="flex items-center gap-2">
                              <span className="text-foreground text-sm">
                                {assignment.professional.display_name}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getProfessionalTypeBadge(
                                  assignment.professional.type
                                )}`}
                              >
                                {getProfessionalTypeLabel(assignment.professional.type)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-foreground-muted text-sm">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              FORM_STATUS_COLORS[assignment.status]
                            }`}
                          >
                            <StatusIcon className={`w-3 h-3 ${assignment.status === 'in_progress' ? 'animate-spin' : ''}`} />
                            {FORM_STATUS_LABELS[assignment.status]}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground-secondary">
                            {formatDate(assignment.due_date)}
                          </span>
                        </td>

                        {/* Completed Date */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground-secondary">
                            {formatDateTime(assignment.completed_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {assignment.status === 'completed' ? (
                            <button
                              onClick={() =>
                                router.push(`/admin/formularios/${assignment.id}`)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dourado hover:bg-dourado/80 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Respostas
                            </button>
                          ) : (
                            <span className="text-xs text-foreground-muted">
                              {assignment.status === 'pending'
                                ? 'Aguardando'
                                : assignment.status === 'in_progress'
                                ? 'Em andamento'
                                : 'Expirado'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-border">
              {filteredAssignments.map((assignment) => {
                const StatusIcon = STATUS_ICONS[assignment.status]
                return (
                  <div key={assignment.id} className="p-4 space-y-3">
                    {/* Patient + Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                          <span className="text-dourado font-medium">
                            {assignment.client?.nome?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {assignment.client?.nome || 'Cliente'}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {assignment.client?.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          FORM_STATUS_COLORS[assignment.status]
                        }`}
                      >
                        <StatusIcon className={`w-3 h-3 ${assignment.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        {FORM_STATUS_LABELS[assignment.status]}
                      </span>
                    </div>

                    {/* Template Name */}
                    <div className="pl-13">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-foreground-muted" />
                        <span className="text-sm text-foreground">
                          {assignment.template?.name || 'Formulario'}
                        </span>
                      </div>
                      {assignment.template?.form_type && (
                        <p className="text-xs text-foreground-muted mt-0.5 ml-6">
                          {FORM_TYPE_LABELS[assignment.template.form_type]}
                        </p>
                      )}
                    </div>

                    {/* Professional + Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {assignment.professional && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getProfessionalTypeBadge(
                            assignment.professional.type
                          )}`}
                        >
                          {getProfessionalTypeLabel(assignment.professional.type)}:{' '}
                          {assignment.professional.display_name}
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      {assignment.due_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Prazo: {formatDate(assignment.due_date)}
                        </span>
                      )}
                      {assignment.completed_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          {formatDateTime(assignment.completed_at)}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    {assignment.status === 'completed' && (
                      <button
                        onClick={() =>
                          router.push(`/admin/formularios/${assignment.id}`)
                        }
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-dourado hover:bg-dourado/80 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Respostas
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Result count */}
        {!loading && filteredAssignments.length > 0 && (
          <div className="px-6 py-3 border-t border-border text-sm text-foreground-secondary">
            {filteredAssignments.length} formulario(s) encontrado(s)
            {(search || statusFilter || specialtyFilter) &&
              ` de ${assignments.length} total`}
          </div>
        )}
      </div>
    </div>
  )
}

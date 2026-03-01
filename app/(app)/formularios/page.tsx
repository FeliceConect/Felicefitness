"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Clock,
  CheckCircle,
  ChevronRight,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
  type FormAssignmentStatus
} from '@/types/forms'

interface FormAssignment {
  id: string
  status: FormAssignmentStatus
  due_date: string | null
  sent_at: string
  completed_at: string | null
  notes: string | null
  template: {
    id: string
    name: string
    description: string | null
    form_type: string
  }
  professional: {
    id: string
    display_name: string
    type: string
  } | null
  draft: {
    current_step: number
    updated_at: string
  } | null
}

export default function FormulariosPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [assignments, setAssignments] = useState<FormAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [activeTab])

  async function fetchAssignments() {
    setLoading(true)
    try {
      const response = await fetch(`/api/forms/assignments?${activeTab === 'completed' ? 'status=completed' : ''}`)
      const data = await response.json()
      if (data.success) {
        setAssignments(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar formulários:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string): string {
    return format(new Date(dateString), "d 'de' MMMM", { locale: ptBR })
  }

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  function getProfessionalLabel(type: string): string {
    switch (type) {
      case 'nutritionist': return 'Nutricionista'
      case 'trainer': return 'Personal Trainer'
      case 'coach': return 'Coach'
      default: return 'Profissional'
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Formulários</h1>
        <p className="text-foreground-secondary text-sm">
          Formulários enviados pelos seus profissionais
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 bg-white rounded-xl p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-dourado text-white'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-dourado text-white'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Preenchidos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-dourado animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            {activeTab === 'pending' ? (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Tudo em dia!</h3>
                <p className="text-foreground-secondary text-sm">
                  Você não tem formulários pendentes para preencher.
                </p>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum formulário preenchido</h3>
                <p className="text-foreground-secondary text-sm">
                  Seus formulários preenchidos aparecerão aqui.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={assignment.status === 'completed' ? '#' : `/formularios/${assignment.id}`}
                className={`block bg-white border border-border rounded-xl p-4 transition-colors ${
                  assignment.status !== 'completed' ? 'hover:border-dourado/30 active:bg-background-elevated' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    assignment.status === 'completed'
                      ? 'bg-emerald-500/20'
                      : assignment.status === 'in_progress'
                        ? 'bg-blue-500/20'
                        : 'bg-dourado/20'
                  }`}>
                    {assignment.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : assignment.status === 'in_progress' ? (
                      <Loader2 className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-dourado" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {assignment.template?.name || 'Formulário'}
                      </h3>
                    </div>

                    {assignment.professional && (
                      <p className="text-xs text-foreground-secondary mb-2">
                        {getProfessionalLabel(assignment.professional.type)}: {assignment.professional.display_name}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                      <span className={`px-2 py-0.5 rounded-full ${FORM_STATUS_COLORS[assignment.status]}`}>
                        {FORM_STATUS_LABELS[assignment.status]}
                      </span>

                      {assignment.due_date && (
                        <span className={`flex items-center gap-1 ${
                          isOverdue(assignment.due_date) && assignment.status !== 'completed'
                            ? 'text-red-400'
                            : 'text-foreground-secondary'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {isOverdue(assignment.due_date) && assignment.status !== 'completed'
                            ? 'Atrasado'
                            : `Prazo: ${formatDate(assignment.due_date)}`
                          }
                        </span>
                      )}

                      {assignment.draft && assignment.status === 'in_progress' && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Clock className="w-3 h-3" />
                          Rascunho salvo
                        </span>
                      )}

                      {assignment.completed_at && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {formatDate(assignment.completed_at)}
                        </span>
                      )}
                    </div>

                    {assignment.notes && assignment.status !== 'completed' && (
                      <p className="text-xs text-foreground-secondary mt-2 italic line-clamp-2">
                        &quot;{assignment.notes}&quot;
                      </p>
                    )}
                  </div>

                  {assignment.status !== 'completed' && (
                    <ChevronRight className="w-5 h-5 text-foreground-muted flex-shrink-0 mt-1" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

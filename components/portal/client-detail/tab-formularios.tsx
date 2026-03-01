'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, CheckCircle, Clock, Eye, Loader2, Send } from 'lucide-react'
import {
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
  type FormAssignmentStatus
} from '@/types/forms'

interface FormAssignment {
  id: string
  template_id: string
  status: FormAssignmentStatus
  due_date: string | null
  created_at: string
  sent_at: string | null
  completed_at: string | null
  notes: string | null
  template: {
    id: string
    name: string
    description: string | null
    specialty: string
    form_type: string
  } | null
}

interface TabFormulariosProps {
  patientId: string
}

export function TabFormularios({ patientId }: TabFormulariosProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<FormAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/portal/forms/assignments?clientId=${patientId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setAssignments(data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-dourado animate-spin" />
      </div>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  if (assignments.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 text-center">
        <ClipboardList className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
        <p className="text-foreground-secondary">Nenhum formulário enviado para este paciente</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="bg-white border border-border rounded-xl p-4 hover:border-dourado/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              assignment.status === 'completed'
                ? 'bg-green-500/10'
                : assignment.status === 'expired'
                ? 'bg-red-500/10'
                : assignment.status === 'in_progress'
                ? 'bg-blue-500/10'
                : 'bg-amber-500/10'
            }`}>
              {assignment.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {assignment.template?.name || 'Formulário'}
                </p>
                <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${FORM_STATUS_COLORS[assignment.status]}`}>
                  {FORM_STATUS_LABELS[assignment.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  Enviado {formatDate(assignment.sent_at || assignment.created_at)}
                </span>
                {assignment.due_date && (
                  <span>Prazo: {formatDate(assignment.due_date)}</span>
                )}
                {assignment.completed_at && (
                  <span className="text-green-600">
                    Preenchido {formatDateTime(assignment.completed_at)}
                  </span>
                )}
              </div>
            </div>
            {assignment.status === 'completed' && (
              <button
                onClick={() => router.push(`/portal/forms/${assignment.id}`)}
                className="flex items-center gap-2 px-3 py-2 bg-background-elevated text-dourado rounded-lg hover:bg-border transition-colors text-sm whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                Ver Respostas
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

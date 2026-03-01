"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  FileText,
  Send,
  AlertCircle
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import {
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
  type FormAssignmentStatus,
  type QuestionType
} from '@/types/forms'

interface QuestionResponse {
  question: {
    id: string
    text: string
    type: QuestionType
    options: { value: string; label: string }[] | null
    config: Record<string, unknown>
    section: string | null
    is_required: boolean
  }
  response: {
    id: string
    response_value: { value?: unknown; values?: string[] }
    responded_at: string
  } | null
}

interface AssignmentDetail {
  assignment: {
    id: string
    status: FormAssignmentStatus
    sent_at: string
    started_at: string | null
    completed_at: string | null
    due_date: string | null
    notes: string | null
    template: {
      id: string
      name: string
      description: string | null
      form_type: string
    }
    client: {
      id: string
      nome: string
      email: string
    }
  }
  questions: QuestionResponse[]
  draft: {
    current_step: number
    updated_at: string
  } | null
  summary: {
    totalQuestions: number
    answeredQuestions: number
    completedAt: string | null
  }
}

export default function FormResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const { isProfessional, loading: professionalLoading } = useProfessional()
  const [data, setData] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalLoading && !isProfessional) {
      router.push('/portal')
    }
  }, [isProfessional, professionalLoading, router])

  useEffect(() => {
    if (params.id && isProfessional) {
      fetchResponses()
    }
  }, [params.id, isProfessional])

  async function fetchResponses() {
    try {
      const response = await fetch(`/api/portal/forms/responses/${params.id}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar respostas')
      }
    } catch (err) {
      console.error('Erro ao buscar respostas:', err)
      setError('Erro ao carregar respostas')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function renderResponseValue(qr: QuestionResponse): React.ReactNode {
    if (!qr.response) {
      return <span className="text-foreground-muted italic">Não respondida</span>
    }

    const value = qr.response.response_value
    const type = qr.question.type

    switch (type) {
      case 'yes_no':
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            value.value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {value.value ? 'Sim' : 'Não'}
          </span>
        )

      case 'consent':
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            value.value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {value.value ? 'Aceito' : 'Não aceito'}
          </span>
        )

      case 'scale': {
        const scaleValue = Number(value.value)
        const config = qr.question.config || {}
        const max = Number(config.max) || 10
        const percentage = (scaleValue / max) * 100
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[200px] bg-background-elevated rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  percentage <= 30 ? 'bg-green-500' :
                  percentage <= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-foreground font-medium">
              {scaleValue}/{max}
            </span>
            {config.minLabel && config.maxLabel ? (
              <span className="text-xs text-foreground-muted">
                ({String(config.minLabel)} → {String(config.maxLabel)})
              </span>
            ) : null}
          </div>
        )
      }

      case 'single_choice':
      case 'dropdown': {
        const selectedOption = qr.question.options?.find(o => o.value === value.value)
        return (
          <span className="px-3 py-1 bg-dourado/20 text-dourado rounded-full text-sm">
            {selectedOption?.label || String(value.value)}
          </span>
        )
      }

      case 'multiple_choice': {
        const selectedValues = value.values || []
        return (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((v: string, i: number) => {
              const option = qr.question.options?.find(o => o.value === v)
              return (
                <span key={i} className="px-3 py-1 bg-dourado/20 text-dourado rounded-full text-sm">
                  {option?.label || v}
                </span>
              )
            })}
          </div>
        )
      }

      case 'number': {
        const config = qr.question.config || {}
        return (
          <span className="text-foreground font-medium">
            {String(value.value)}
            {config.unit ? <span className="text-foreground-muted ml-1">{String(config.unit)}</span> : null}
          </span>
        )
      }

      case 'date':
        return <span className="text-foreground">{formatDate(String(value.value))}</span>

      case 'long_text':
        return (
          <p className="text-foreground-secondary bg-background-elevated rounded-lg p-3 whitespace-pre-wrap">
            {String(value.value)}
          </p>
        )

      default:
        return <span className="text-foreground">{String(value.value)}</span>
    }
  }

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/portal/forms')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Formulários
        </button>
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro</h3>
          <p className="text-foreground-secondary">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { assignment, questions, summary } = data

  // Agrupar por seção
  let currentSection = ''
  const groupedQuestions: { section: string; items: QuestionResponse[] }[] = []

  questions.forEach(qr => {
    const section = qr.question.section || 'Geral'
    if (section !== currentSection) {
      currentSection = section
      groupedQuestions.push({ section, items: [] })
    }
    groupedQuestions[groupedQuestions.length - 1].items.push(qr)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/portal/forms')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Formulários
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{assignment.template?.name || 'Formulário'}</h1>
            <p className="text-foreground-secondary">{assignment.template?.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full self-start ${FORM_STATUS_COLORS[assignment.status]}`}>
            {FORM_STATUS_LABELS[assignment.status]}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-dourado" />
            <div>
              <p className="text-sm text-foreground-secondary">Paciente</p>
              <p className="text-foreground font-medium">{assignment.client.nome}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-foreground-secondary">Enviado em</p>
              <p className="text-foreground font-medium">{formatDate(assignment.sent_at)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm text-foreground-secondary">Respostas</p>
              <p className="text-foreground font-medium">{summary.answeredQuestions}/{summary.totalQuestions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            {assignment.completed_at ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-400" />
            )}
            <div>
              <p className="text-sm text-foreground-secondary">
                {assignment.completed_at ? 'Preenchido em' : 'Status'}
              </p>
              <p className="text-foreground font-medium">
                {assignment.completed_at
                  ? formatDateTime(assignment.completed_at)
                  : 'Aguardando preenchimento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {assignment.notes && (
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-sm text-foreground-secondary mb-1">Mensagem enviada ao paciente:</p>
          <p className="text-foreground-secondary italic">&quot;{assignment.notes}&quot;</p>
        </div>
      )}

      {/* Responses by Section */}
      {assignment.status === 'completed' ? (
        <div className="space-y-6">
          {groupedQuestions.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 bg-background-elevated border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">{group.section}</h2>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((qr, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground-secondary">
                        {qr.question.text}
                      </p>
                      {qr.question.is_required && (
                        <span className="text-red-400 text-xs mt-0.5">*</span>
                      )}
                    </div>
                    <div className="mt-1">
                      {renderResponseValue(qr)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aguardando Preenchimento</h3>
          <p className="text-foreground-secondary">
            O paciente ainda não completou este formulário.
            {data.draft && (
              <span className="block mt-2 text-blue-400">
                Progresso: Step {data.draft.current_step + 1} (Última atualização: {formatDateTime(data.draft.updated_at)})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

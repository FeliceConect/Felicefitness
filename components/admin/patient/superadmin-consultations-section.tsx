"use client"

import { useEffect, useState } from 'react'
import { Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'

interface Consultation {
  id: string
  consultation_date: string
  program_name_snapshot: string
  program_month: number | null
  consultation_type: string
  main_complaint: string | null
  evolution: string | null
  adherence: Record<string, number>
  objective_data: Record<string, unknown>
  emotional_state: number | null
  emotional_notes: string | null
  team_feedback: string | null
  action_plan: string | null
  private_notes: string | null
  next_consultation_date: string | null
  created_at: string
  created_by_name: string
}

interface Props {
  userId: string
  refreshKey: number
}

const TYPE_LABEL: Record<string, string> = {
  inicial: 'Inicial',
  acompanhamento: 'Acompanhamento',
  avaliacao: 'Avaliação',
  encerramento: 'Encerramento',
}

const PROGRAM_LABEL: Record<string, string> = {
  felice_wellness: 'Felice Wellness',
  wellness_performance: 'Wellness Performance',
  felicita_wellness: 'Felicita Wellness',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export function SuperadminConsultationsSection({ userId, refreshKey }: Props) {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/medical-records/${userId}/consultations`)
        const json = await res.json()
        if (json.success) setConsultations(json.consultations || [])
      } catch (err) {
        console.error('Erro ao buscar consultas:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, refreshKey])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Stethoscope className="w-5 h-5 text-dourado" />
        <h2 className="text-lg font-semibold text-foreground">Consultas do Superadmin</h2>
        <span className="text-xs text-foreground-muted">({consultations.length})</span>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-foreground-muted">Carregando...</p>
        ) : consultations.length === 0 ? (
          <p className="text-sm text-foreground-secondary">Nenhuma consulta registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const isOpen = expanded.has(c.id)
              return (
                <div key={c.id} className="bg-background-elevated/50 rounded-lg border border-border/50 overflow-hidden">
                  <button
                    onClick={() => toggle(c.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-background-elevated transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-left">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(c.consultation_date)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-dourado/20 text-dourado border border-dourado/30">
                        {TYPE_LABEL[c.consultation_type] || c.consultation_type}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-background-elevated text-foreground-muted border border-border">
                        {PROGRAM_LABEL[c.program_name_snapshot] || c.program_name_snapshot}
                        {c.program_month ? ` · Mês ${c.program_month}` : ''}
                      </span>
                      <span className="text-xs text-foreground-muted">por {c.created_by_name}</span>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-foreground-secondary flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 text-sm">
                      {c.main_complaint && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Queixa / foco</p>
                          <p className="text-foreground whitespace-pre-wrap">{c.main_complaint}</p>
                        </div>
                      )}
                      {c.evolution && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Evolução</p>
                          <p className="text-foreground whitespace-pre-wrap">{c.evolution}</p>
                        </div>
                      )}
                      {c.adherence && Object.keys(c.adherence).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Aderência</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(c.adherence).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-background-elevated border border-border text-foreground">
                                {k}: <strong className="text-dourado">{v}/5</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.emotional_state !== null && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Estado emocional</p>
                          <p className="text-foreground"><strong className="text-dourado">{c.emotional_state}/10</strong>{c.emotional_notes ? ` — ${c.emotional_notes}` : ''}</p>
                        </div>
                      )}
                      {c.team_feedback && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Feedback da equipe</p>
                          <p className="text-foreground whitespace-pre-wrap">{c.team_feedback}</p>
                        </div>
                      )}
                      {c.action_plan && (
                        <div>
                          <p className="text-xs font-medium text-foreground-secondary uppercase mb-1">Conduta / plano</p>
                          <p className="text-foreground whitespace-pre-wrap">{c.action_plan}</p>
                        </div>
                      )}
                      {c.private_notes && (
                        <div className="border-l-2 border-vinho/40 pl-3">
                          <p className="text-xs font-medium text-vinho uppercase mb-1">Observações privadas</p>
                          <p className="text-foreground whitespace-pre-wrap">{c.private_notes}</p>
                        </div>
                      )}
                      {c.next_consultation_date && (
                        <p className="text-xs text-foreground-muted">
                          Próxima consulta sugerida: {formatDate(c.next_consultation_date)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

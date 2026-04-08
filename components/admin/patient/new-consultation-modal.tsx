"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { X, Save } from 'lucide-react'

interface NewConsultationModalProps {
  userId: string
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type AdherenceKey = 'food' | 'workout' | 'sleep' | 'hydration'

export function NewConsultationModal({ userId, open, onClose, onCreated }: NewConsultationModalProps) {
  const [saving, setSaving] = useState(false)

  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().slice(0, 10))
  const [consultationType, setConsultationType] = useState('acompanhamento')
  const [mainComplaint, setMainComplaint] = useState('')
  const [evolution, setEvolution] = useState('')
  const [adherence, setAdherence] = useState<Record<AdherenceKey, number>>({
    food: 3, workout: 3, sleep: 3, hydration: 3,
  })
  const [weight, setWeight] = useState('')
  const [emotionalState, setEmotionalState] = useState(7)
  const [emotionalNotes, setEmotionalNotes] = useState('')
  const [teamFeedback, setTeamFeedback] = useState('')
  const [actionPlan, setActionPlan] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [nextDate, setNextDate] = useState('')

  const reset = () => {
    setConsultationDate(new Date().toISOString().slice(0, 10))
    setConsultationType('acompanhamento')
    setMainComplaint('')
    setEvolution('')
    setAdherence({ food: 3, workout: 3, sleep: 3, hydration: 3 })
    setWeight('')
    setEmotionalState(7)
    setEmotionalNotes('')
    setTeamFeedback('')
    setActionPlan('')
    setPrivateNotes('')
    setNextDate('')
  }

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/medical-records/${userId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultation_date: consultationDate,
          consultation_type: consultationType,
          main_complaint: mainComplaint,
          evolution,
          adherence,
          objective_data: weight ? { peso: parseFloat(weight) } : {},
          emotional_state: emotionalState,
          emotional_notes: emotionalNotes,
          team_feedback: teamFeedback,
          action_plan: actionPlan,
          private_notes: privateNotes,
          next_consultation_date: nextDate || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        reset()
        onCreated()
        onClose()
        toast.success('Consulta registrada')
      } else {
        toast.error(json.error || 'Erro ao registrar consulta')
      }
    } catch (err) {
      console.error('Erro ao criar consulta:', err)
      toast.error('Erro ao registrar consulta')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const adherenceLabels: Record<AdherenceKey, string> = {
    food: 'Alimentação',
    workout: 'Treino',
    sleep: 'Sono',
    hydration: 'Hidratação',
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Nova Consulta</h2>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">Data</label>
              <input
                type="date"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
                className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">Tipo</label>
              <select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
                className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              >
                <option value="inicial">Inicial</option>
                <option value="acompanhamento">Acompanhamento</option>
                <option value="avaliacao">Avaliação</option>
                <option value="encerramento">Encerramento</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Queixa / foco do dia</label>
            <textarea
              value={mainComplaint}
              onChange={(e) => setMainComplaint(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Evolução desde a última consulta</label>
            <textarea
              value={evolution}
              onChange={(e) => setEvolution(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-2">Aderência (1-5)</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(adherenceLabels) as AdherenceKey[]).map((k) => (
                <div key={k} className="bg-background-elevated rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground-secondary">{adherenceLabels[k]}</span>
                    <span className="text-sm font-bold text-dourado">{adherence[k]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={adherence[k]}
                    onChange={(e) => setAdherence(prev => ({ ...prev, [k]: parseInt(e.target.value) }))}
                    className="w-full accent-dourado"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">Peso do dia (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Estado emocional: <span className="text-dourado font-bold">{emotionalState}</span>/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={emotionalState}
                onChange={(e) => setEmotionalState(parseInt(e.target.value))}
                className="w-full accent-dourado mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Notas sobre o estado emocional</label>
            <textarea
              value={emotionalNotes}
              onChange={(e) => setEmotionalNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Feedback da equipe (nutri / personal / coach)</label>
            <textarea
              value={teamFeedback}
              onChange={(e) => setTeamFeedback(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Conduta / Plano de ação</label>
            <textarea
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Observações privadas</label>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Próxima consulta (opcional)</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-background-elevated/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-elevated hover:bg-border text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-dourado hover:bg-dourado/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Consulta'}
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, FileText, Calendar, Trash2, ChevronDown, ChevronUp, Save, X, Loader2 } from 'lucide-react'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedWarning } from '@/hooks/use-unsaved-warning'
import { DraftRestoreBanner } from '@/components/ui/draft-restore-banner'
import { DraftStatusIndicator } from '@/components/ui/draft-status-indicator'

interface ExamFormValue {
  examDate: string
  examType: string
  description: string
  results: string
  observations: string
}

interface Exam {
  id: string
  patient_id: string
  professional_id: string
  exam_date: string
  exam_type: string
  description: string
  results: string
  observations: string
  created_at: string
}

interface TabExamesProps {
  patientId: string
  professionalId: string
}

const EXAM_TYPES = [
  { value: 'hemograma', label: 'Hemograma Completo' },
  { value: 'bioquimica', label: 'Bioquímica (Glicose, Colesterol, etc.)' },
  { value: 'hormonal', label: 'Painel Hormonal' },
  { value: 'tireoide', label: 'Tireoide (TSH, T3, T4)' },
  { value: 'hepatico', label: 'Função Hepática' },
  { value: 'renal', label: 'Função Renal' },
  { value: 'vitaminas', label: 'Vitaminas e Minerais' },
  { value: 'inflamatorio', label: 'Marcadores Inflamatórios' },
  { value: 'imagem', label: 'Exame de Imagem' },
  { value: 'urina', label: 'Urina / Fezes' },
  { value: 'genetico', label: 'Teste Genético' },
  { value: 'outro', label: 'Outro' },
]

export function TabExames({ patientId, professionalId }: TabExamesProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set())

  // Form state
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10))
  const [examType, setExamType] = useState('hemograma')
  const [description, setDescription] = useState('')
  const [results, setResults] = useState('')
  const [observations, setObservations] = useState('')

  const formValue: ExamFormValue = useMemo(
    () => ({ examDate, examType, description, results, observations }),
    [examDate, examType, description, results, observations]
  )
  const isEmpty = useMemo(
    () => (v: ExamFormValue) =>
      !v.description.trim() && !v.results.trim() && !v.observations.trim(),
    []
  )
  const {
    status: draftStatus,
    lastSavedAt,
    pendingDraft,
    clearDraft,
    dismissPending,
  } = useDraftAutosave<ExamFormValue>(
    `exam:${patientId}:new`,
    formValue,
    { enabled: showForm, isEmpty }
  )
  useUnsavedWarning(showForm && !isEmpty(formValue))

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/exams?patientId=${patientId}`)
      const data = await res.json()
      if (data.success) {
        setExams(data.exams || [])
      }
    } catch (err) {
      console.error('Erro ao buscar exames:', err)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  const resetForm = () => {
    setExamDate(new Date().toISOString().slice(0, 10))
    setExamType('hemograma')
    setDescription('')
    setResults('')
    setObservations('')
  }

  const handleSave = async () => {
    if (!results.trim()) {
      toast.error('Preencha os resultados do exame')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/portal/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          professional_id: professionalId,
          exam_date: examDate,
          exam_type: examType,
          description,
          results,
          observations,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Exame registrado com sucesso')
        clearDraft()
        resetForm()
        setShowForm(false)
        fetchExams()
      } else {
        toast.error(data.error || 'Erro ao salvar exame')
      }
    } catch {
      toast.error('Erro ao salvar exame')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (examId: string) => {
    if (!confirm('Tem certeza que deseja excluir este exame?')) return
    try {
      const res = await fetch(`/api/portal/exams/${examId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Exame excluído')
        setExams(prev => prev.filter(e => e.id !== examId))
      } else {
        toast.error(data.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir exame')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedExams(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getExamTypeLabel = (type: string) => {
    return EXAM_TYPES.find(t => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-dourado animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Exames do Paciente
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Exame'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-4 space-y-3">
          {pendingDraft && (
            <DraftRestoreBanner
              savedAt={pendingDraft.savedAt}
              onRestore={() => {
                const v = pendingDraft.value
                setExamDate(v.examDate || new Date().toISOString().slice(0, 10))
                setExamType(v.examType || 'hemograma')
                setDescription(v.description || '')
                setResults(v.results || '')
                setObservations(v.observations || '')
                dismissPending()
              }}
              onDiscard={clearDraft}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">Data do Exame</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">Tipo de Exame</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              >
                {EXAM_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Hemograma completo + PCR + VHS"
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Resultados *</label>
            <textarea
              value={results}
              onChange={(e) => setResults(e.target.value)}
              rows={5}
              placeholder="Cole aqui os resultados do exame, valores de referência, etc."
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Observações do Médico</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              placeholder="Interpretação clínica, correlações, próximos passos..."
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <DraftStatusIndicator status={draftStatus} lastSavedAt={lastSavedAt} />
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Exame'}
            </button>
          </div>
        </div>
      )}

      {/* Exams list */}
      {exams.length === 0 ? (
        <div className="text-center py-8 bg-background-elevated/30 rounded-xl border border-border">
          <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary text-sm">Nenhum exame registrado</p>
          <p className="text-foreground-muted text-xs mt-1">Clique em &quot;Novo Exame&quot; para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => {
            const isExpanded = expandedExams.has(exam.id)
            return (
              <div key={exam.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleExpand(exam.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-background-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{getExamTypeLabel(exam.exam_type)}</p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                        {exam.description && ` — ${exam.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(exam.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-foreground-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div>
                      <p className="text-xs font-medium text-foreground-secondary mb-1">Resultados</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-background-elevated rounded-lg p-3">{exam.results}</p>
                    </div>
                    {exam.observations && (
                      <div>
                        <p className="text-xs font-medium text-foreground-secondary mb-1">Observações do Médico</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap bg-emerald-50 rounded-lg p-3">{exam.observations}</p>
                      </div>
                    )}
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

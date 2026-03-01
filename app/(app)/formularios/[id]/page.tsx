"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import type { QuestionType, ResponseValue } from '@/types/forms'

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  options: { value: string; label: string }[] | null
  config: Record<string, unknown>
  is_required: boolean
  order_index: number
  section: string | null
}

interface Section {
  title: string
  subtitle?: string
  questions: Question[]
}

interface FormData {
  assignment: {
    id: string
    status: string
    due_date: string | null
    notes: string | null
    template: {
      name: string
      description: string | null
      form_type: string
    }
    professional: {
      display_name: string
      type: string
    } | null
  }
  sections: Section[]
  questions: Question[]
  draft: {
    draft_data: Record<string, ResponseValue>
    current_step: number
  } | null
  totalQuestions: number
}

export default function FormWizardPage() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchForm()
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [params.id])

  async function fetchForm() {
    try {
      const response = await fetch(`/api/forms/assignments/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setFormData(data.data)
        // Restore draft if exists
        if (data.data.draft?.draft_data) {
          setResponses(data.data.draft.draft_data)
          setCurrentStep(data.data.draft.current_step || 0)
        }
      } else {
        setError(data.error || 'Erro ao carregar formulário')
      }
    } catch (err) {
      console.error('Erro ao buscar formulário:', err)
      setError('Erro ao carregar formulário')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save draft when responses change
  const saveDraft = useCallback(async (step: number) => {
    if (!formData) return
    setIsSaving(true)
    try {
      await fetch('/api/forms/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: formData.assignment.id,
          draftData: responses,
          currentStep: step,
        }),
      })
      setLastSavedAt(new Date().toISOString())
    } catch (err) {
      console.error('Erro ao salvar rascunho:', err)
    } finally {
      setIsSaving(false)
    }
  }, [formData, responses])

  // Debounced auto-save on response changes
  useEffect(() => {
    if (!formData || Object.keys(responses).length === 0) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveDraft(currentStep)
    }, 3000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [responses, currentStep, saveDraft, formData])

  function setResponse(questionId: string, value: ResponseValue) {
    setResponses(prev => ({ ...prev, [questionId]: value }))
    // Clear validation error
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  function validateCurrentStep(): boolean {
    if (!formData) return false
    const section = formData.sections[currentStep]
    if (!section) return true

    const errors: Record<string, string> = {}
    section.questions.forEach(q => {
      if (q.is_required && q.question_type !== 'section_header') {
        const response = responses[q.id]
        if (!response) {
          errors[q.id] = 'Campo obrigatório'
        } else if ('value' in response && (response.value === '' || response.value === undefined || response.value === null)) {
          errors[q.id] = 'Campo obrigatório'
        } else if ('values' in response && (!response.values || response.values.length === 0)) {
          errors[q.id] = 'Selecione pelo menos uma opção'
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  function goToStep(step: number) {
    if (step < 0 || !formData || step >= formData.sections.length) return
    if (step > currentStep && !validateCurrentStep()) return
    saveDraft(step)
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!formData || !validateCurrentStep()) return

    // Validate all required fields across all sections
    const allErrors: Record<string, string> = {}
    formData.questions.forEach(q => {
      if (q.is_required && q.question_type !== 'section_header') {
        const response = responses[q.id]
        if (!response) {
          allErrors[q.id] = 'Campo obrigatório'
        } else if ('value' in response && (response.value === '' || response.value === undefined || response.value === null)) {
          allErrors[q.id] = 'Campo obrigatório'
        }
      }
    })

    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors)
      // Find first section with error
      for (let i = 0; i < formData.sections.length; i++) {
        const sectionQuestionIds = formData.sections[i].questions.map(q => q.id)
        if (sectionQuestionIds.some(id => allErrors[id])) {
          setCurrentStep(i)
          break
        }
      }
      return
    }

    setShowConfirmSubmit(true)
  }

  async function confirmSubmit() {
    if (!formData) return

    setIsSubmitting(true)
    setShowConfirmSubmit(false)

    try {
      // Build responses array
      const responseArray = formData.questions
        .filter(q => q.question_type !== 'section_header' && responses[q.id])
        .map(q => ({
          questionId: q.id,
          value: responses[q.id],
        }))

      const response = await fetch('/api/forms/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: formData.assignment.id,
          responses: responseArray,
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push('/formularios?submitted=true')
      } else {
        setError(data.error || 'Erro ao enviar formulário')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Erro ao enviar:', err)
      setError('Erro ao enviar formulário')
      setIsSubmitting(false)
    }
  }

  function getAnsweredCount(): number {
    if (!formData) return 0
    return formData.questions.filter(
      q => q.question_type !== 'section_header' && responses[q.id]
    ).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dourado animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 pt-12">
        <button
          onClick={() => router.push('/formularios')}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro</h3>
          <p className="text-foreground-secondary text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!formData) return null

  const totalSteps = formData.sections.length
  const currentSection = formData.sections[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top bar with back + progress */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/formularios')}
            className="p-1 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">
              {formData.assignment.template?.name}
            </p>
            <p className="text-xs text-foreground-muted">
              Passo {currentStep + 1} de {totalSteps}
            </p>
          </div>
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Salvando...
            </span>
          )}
          {!isSaving && lastSavedAt && (
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              <Clock className="w-3 h-3" />
              Salvo
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-border">
          <motion.div
            className="h-1 bg-gradient-to-r from-dourado to-dourado"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 pt-20 pb-4">
        {formData.assignment.notes && currentStep === 0 && (
          <div className="bg-dourado/10 border border-dourado/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-dourado">
              <span className="font-medium">
                {formData.assignment.professional?.display_name || 'Profissional'}:
              </span>{' '}
              &quot;{formData.assignment.notes}&quot;
            </p>
          </div>
        )}

        <h2 className="text-xl font-bold text-foreground mb-1">{currentSection?.title}</h2>
        {currentSection?.subtitle && (
          <p className="text-sm text-foreground-secondary">{currentSection.subtitle}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-foreground-muted">
            {getAnsweredCount()}/{formData.totalQuestions} respondidas
          </span>
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="px-4 space-y-6"
        >
          {currentSection?.questions.map((question, index) => (
            <QuestionField
              key={question.id}
              question={question}
              value={responses[question.id]}
              onChange={(value) => setResponse(question.id, value)}
              error={validationErrors[question.id]}
              index={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 mb-3">
          {formData.sections.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= currentStep && goToStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-dourado'
                  : i < currentStep
                    ? 'w-3 bg-dourado/50 cursor-pointer'
                    : 'w-3 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-border rounded-xl text-foreground font-medium transition-colors hover:bg-background-elevated"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-dourado to-dourado rounded-xl text-white font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Formulário
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dourado rounded-xl text-white font-medium transition-colors hover:bg-dourado/80"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border rounded-xl max-w-sm w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-dourado/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-dourado" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Enviar Formulário?</h3>
                <p className="text-sm text-foreground-secondary">
                  Após o envio, suas respostas serão enviadas para{' '}
                  {formData.assignment.professional?.display_name || 'seu profissional'} e
                  não poderão ser alteradas.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-3 bg-background-elevated border border-border rounded-xl text-foreground font-medium transition-colors hover:bg-background-elevated/80"
                >
                  Revisar
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-dourado to-dourado rounded-xl text-white font-medium transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// Question Field Component
// ============================================

function QuestionField({
  question,
  value,
  onChange,
  error,
  index,
}: {
  question: Question
  value: ResponseValue | undefined
  onChange: (value: ResponseValue) => void
  error?: string
  index: number
}) {
  const config = question.config || {}

  function getCurrentValue(): string | number | boolean | string[] | undefined {
    if (!value) return undefined
    if ('values' in value) return value.values
    return value.value
  }

  const currentValue = getCurrentValue()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Question Label */}
      <label className="block text-sm font-medium text-foreground mb-2">
        {question.question_text}
        {question.is_required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {/* Field by type */}
      {question.question_type === 'short_text' && (
        <input
          type="text"
          value={(currentValue as string) || ''}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={(config.placeholder as string) || ''}
          maxLength={(config.maxLength as number) || undefined}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-dourado transition-colors ${
            error ? 'border-red-500' : 'border-border'
          }`}
        />
      )}

      {question.question_type === 'long_text' && (
        <textarea
          value={(currentValue as string) || ''}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={(config.placeholder as string) || ''}
          maxLength={(config.maxLength as number) || undefined}
          rows={4}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-dourado transition-colors resize-none ${
            error ? 'border-red-500' : 'border-border'
          }`}
        />
      )}

      {question.question_type === 'number' && (
        <div className="relative">
          <input
            type="number"
            value={currentValue !== undefined ? String(currentValue) : ''}
            onChange={(e) => onChange({ value: e.target.value ? Number(e.target.value) : '' })}
            min={(config.min as number) ?? undefined}
            max={(config.max as number) ?? undefined}
            step={(config.step as number) ?? undefined}
            placeholder={(config.placeholder as string) || ''}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-dourado transition-colors ${
              config.unit ? 'pr-14' : ''
            } ${error ? 'border-red-500' : 'border-border'}`}
          />
          {config.unit ? (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-secondary text-sm">
              {String(config.unit)}
            </span>
          ) : null}
        </div>
      )}

      {question.question_type === 'scale' && (
        <ScaleInput
          value={currentValue as number | undefined}
          onChange={(v) => onChange({ value: v })}
          min={(config.min as number) ?? 1}
          max={(config.max as number) ?? 10}
          minLabel={(config.minLabel as string) || ''}
          maxLabel={(config.maxLabel as string) || ''}
          error={!!error}
        />
      )}

      {question.question_type === 'single_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ value: option.value })}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                currentValue === option.value
                  ? 'border-dourado bg-dourado/10 text-foreground'
                  : `border-border bg-white text-foreground-secondary hover:border-border ${error ? 'border-red-500/50' : ''}`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  currentValue === option.value
                    ? 'border-dourado bg-dourado'
                    : 'border-border'
                }`}>
                  {currentValue === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {question.question_type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = Array.isArray(currentValue) && currentValue.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => {
                  const current = (Array.isArray(currentValue) ? currentValue : []) as string[]
                  const updated = selected
                    ? current.filter(v => v !== option.value)
                    : [...current, option.value]
                  onChange({ values: updated })
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selected
                    ? 'border-dourado bg-dourado/10 text-foreground'
                    : `border-border bg-white text-foreground-secondary hover:border-border ${error ? 'border-red-500/50' : ''}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selected
                      ? 'border-dourado bg-dourado'
                      : 'border-border'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {question.question_type === 'dropdown' && question.options && (
        <div className="relative">
          <select
            value={(currentValue as string) || ''}
            onChange={(e) => onChange({ value: e.target.value })}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground appearance-none focus:outline-none focus:border-dourado transition-colors ${
              error ? 'border-red-500' : 'border-border'
            } ${!currentValue ? 'text-foreground-muted' : ''}`}
          >
            <option value="">Selecione...</option>
            {question.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary pointer-events-none" />
        </div>
      )}

      {question.question_type === 'yes_no' && (
        <div className="flex gap-3">
          <button
            onClick={() => onChange({ value: true })}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
              currentValue === true
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : `border-border bg-white text-foreground-secondary hover:border-border ${error ? 'border-red-500/50' : ''}`
            }`}
          >
            Sim
          </button>
          <button
            onClick={() => onChange({ value: false })}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
              currentValue === false
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : `border-border bg-white text-foreground-secondary hover:border-border ${error ? 'border-red-500/50' : ''}`
            }`}
          >
            Não
          </button>
        </div>
      )}

      {question.question_type === 'date' && (
        <input
          type="date"
          value={(currentValue as string) || ''}
          onChange={(e) => onChange({ value: e.target.value })}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-foreground focus:outline-none focus:border-dourado transition-colors ${
            error ? 'border-red-500' : 'border-border'
          }`}
        />
      )}

      {question.question_type === 'consent' && (
        <label className={`flex items-start gap-3 p-4 bg-white border rounded-xl cursor-pointer transition-all ${
          currentValue === true
            ? 'border-dourado bg-dourado/5'
            : `border-border hover:border-border ${error ? 'border-red-500/50' : ''}`
        }`}>
          <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            currentValue === true
              ? 'border-dourado bg-dourado'
              : 'border-border'
          }`}>
            {currentValue === true && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <span className="text-sm text-foreground-secondary">
              {(config.consentText as string) || question.question_text}
            </span>
            <input
              type="checkbox"
              checked={currentValue === true}
              onChange={(e) => onChange({ value: e.target.checked })}
              className="sr-only"
            />
          </div>
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </motion.div>
  )
}

// ============================================
// Scale Input Component
// ============================================

function ScaleInput({
  value,
  onChange,
  min,
  max,
  minLabel,
  maxLabel,
  error,
}: {
  value: number | undefined
  onChange: (v: number) => void
  min: number
  max: number
  minLabel: string
  maxLabel: string
  error: boolean
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center">
        {steps.map((step) => (
          <button
            key={step}
            onClick={() => onChange(step)}
            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
              value === step
                ? 'bg-dourado text-white scale-110'
                : `bg-white border text-foreground-secondary hover:border-dourado/50 ${
                    error ? 'border-red-500/50' : 'border-border'
                  }`
            }`}
          >
            {step}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-foreground-muted">{minLabel}</span>
          <span className="text-xs text-foreground-muted">{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

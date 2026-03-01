"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
  Type,
  AlignLeft,
  Hash,
  SlidersHorizontal,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Calendar,
  ShieldCheck,
  Heading,
  Loader2,
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import {
  type QuestionType,
  type FormType,
  type QuestionOption,
  type QuestionConfig,
  QUESTION_TYPE_LABELS,
  FORM_TYPE_LABELS,
} from '@/types/forms'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ============================================
// TYPES
// ============================================

interface EditorQuestion {
  id: string
  question_text: string
  question_type: QuestionType
  is_required: boolean
  section: string
  options: QuestionOption[]
  config: QuestionConfig
}

interface Section {
  id: string
  name: string
}

const QUESTION_TYPE_ICON_MAP: Record<QuestionType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  number: Hash,
  scale: SlidersHorizontal,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  date: Calendar,
  consent: ShieldCheck,
  section_header: Heading,
}

const QUESTION_TYPES_FOR_PICKER: QuestionType[] = [
  'short_text',
  'long_text',
  'number',
  'scale',
  'single_choice',
  'multiple_choice',
  'dropdown',
  'yes_no',
  'date',
  'consent',
]

const FORM_TYPES: FormType[] = [
  'initial_assessment',
  'weekly_checkin',
  'progress_review',
  'food_recall',
  'custom',
]

// ============================================
// SORTABLE QUESTION ITEM
// ============================================

function SortableQuestion({
  question,
  index,
  onRemove,
  onEdit,
}: {
  question: EditorQuestion
  index: number
  onRemove: () => void
  onEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = QUESTION_TYPE_ICON_MAP[question.question_type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-background-elevated border border-border rounded-lg group ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-border"
      >
        <GripVertical className="w-4 h-4 text-foreground-secondary" />
      </button>

      <span className="text-sm text-foreground-muted font-mono w-6">{index + 1}.</span>

      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <p className="text-sm text-foreground truncate">{question.question_text}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-foreground-secondary">
            <Icon className="w-3 h-3" />
            {QUESTION_TYPE_LABELS[question.question_type]}
          </span>
          {question.is_required && (
            <span className="text-xs text-amber-400">Obrigatório</span>
          )}
          {question.options.length > 0 && (
            <span className="text-xs text-foreground-muted">{question.options.length} opções</span>
          )}
        </div>
      </button>

      <button
        onClick={onRemove}
        className="p-1.5 rounded hover:bg-red-500/20 text-foreground-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================
// QUESTION EDITOR MODAL
// ============================================

function QuestionEditorModal({
  question,
  onSave,
  onClose,
}: {
  question: EditorQuestion | null
  onSave: (q: EditorQuestion) => void
  onClose: () => void
}) {
  const isNew = !question
  const [form, setForm] = useState<EditorQuestion>(
    question || {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'short_text',
      is_required: false,
      section: '',
      options: [],
      config: {},
    }
  )

  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(form.question_type)
  const hasNumberConfig = form.question_type === 'number'
  const hasScaleConfig = form.question_type === 'scale'
  const hasTextConfig = ['short_text', 'long_text'].includes(form.question_type)
  const hasConsentConfig = form.question_type === 'consent'

  function addOption() {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { value: `opt_${prev.options.length + 1}`, label: '' }],
    }))
  }

  function removeOption(index: number) {
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  function updateOption(index: number, label: string) {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, label, value: label.toLowerCase().replace(/\s+/g, '_') || `opt_${i + 1}` } : opt
      ),
    }))
  }

  function handleTypeChange(type: QuestionType) {
    const needsOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(type)
    setForm(prev => ({
      ...prev,
      question_type: type,
      options: needsOptions && prev.options.length === 0 ? [{ value: 'opt_1', label: '' }] : needsOptions ? prev.options : [],
      config: {},
    }))
  }

  function handleSave() {
    if (!form.question_text.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 my-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">
            {isNew ? 'Adicionar Pergunta' : 'Editar Pergunta'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Texto da pergunta *
            </label>
            <input
              type="text"
              value={form.question_text}
              onChange={(e) => setForm(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder="Ex: Qual é o seu objetivo principal?"
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
            />
          </div>

          {/* Question type */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Tipo de resposta
            </label>
            <select
              value={form.question_type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
            >
              {QUESTION_TYPES_FOR_PICKER.map((type) => (
                <option key={type} value={type}>
                  {QUESTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground-secondary">Obrigatório?</label>
            <button
              onClick={() => setForm(prev => ({ ...prev, is_required: !prev.is_required }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_required ? 'bg-dourado' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.is_required ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Options (for choice types) */}
          {hasOptions && (
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">Opções</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted w-6">{i + 1}.</span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Opção ${i + 1}`}
                      className="flex-1 px-3 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado text-sm"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1 hover:bg-red-500/20 text-foreground-muted hover:text-red-400 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                className="mt-2 text-sm text-dourado hover:text-dourado/80 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar opção
              </button>
            </div>
          )}

          {/* Number config */}
          {hasNumberConfig && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Mínimo</label>
                <input
                  type="number"
                  value={form.config.min ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, min: e.target.value ? Number(e.target.value) : undefined } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Máximo</label>
                <input
                  type="number"
                  value={form.config.max ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, max: e.target.value ? Number(e.target.value) : undefined } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Passo</label>
                <input
                  type="number"
                  value={form.config.step ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, step: e.target.value ? Number(e.target.value) : undefined } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Unidade</label>
                <input
                  type="text"
                  value={form.config.unit ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, unit: e.target.value || undefined } }))}
                  placeholder="kg, cm..."
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:border-dourado"
                />
              </div>
            </div>
          )}

          {/* Scale config */}
          {hasScaleConfig && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Valor mínimo</label>
                <input
                  type="number"
                  value={form.config.min ?? 1}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, min: Number(e.target.value) } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Valor máximo</label>
                <input
                  type="number"
                  value={form.config.max ?? 10}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, max: Number(e.target.value) } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Label mínimo</label>
                <input
                  type="text"
                  value={form.config.minLabel ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, minLabel: e.target.value || undefined } }))}
                  placeholder="Ex: Nada"
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Label máximo</label>
                <input
                  type="text"
                  value={form.config.maxLabel ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, maxLabel: e.target.value || undefined } }))}
                  placeholder="Ex: Muito"
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:border-dourado"
                />
              </div>
            </div>
          )}

          {/* Text config */}
          {hasTextConfig && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-foreground-muted mb-1">Placeholder</label>
                <input
                  type="text"
                  value={form.config.placeholder ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, placeholder: e.target.value || undefined } }))}
                  placeholder="Texto de ajuda..."
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:border-dourado"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Máx. caracteres</label>
                <input
                  type="number"
                  value={form.config.maxLength ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, maxLength: e.target.value ? Number(e.target.value) : undefined } }))}
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-dourado"
                />
              </div>
            </div>
          )}

          {/* Consent config */}
          {hasConsentConfig && (
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Texto do consentimento</label>
              <textarea
                value={form.config.consentText ?? ''}
                onChange={(e) => setForm(prev => ({ ...prev, config: { ...prev.config, consentText: e.target.value || undefined } }))}
                placeholder="Texto legal do consentimento..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:border-dourado resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.question_text.trim()}
            className="flex-1 px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNew ? 'Adicionar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function CreateTemplatePage() {
  const router = useRouter()
  const { isProfessional, isNutritionist, loading: professionalLoading } = useProfessional()

  // Template fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formType, setFormType] = useState<FormType>('custom')

  // Sections & questions
  const [sections, setSections] = useState<Section[]>([
    { id: crypto.randomUUID(), name: 'Geral' },
  ])
  const [questions, setQuestions] = useState<EditorQuestion[]>([])
  const [expandedSections, setExpandedSections] = useState<string[]>(['all'])

  // Modal state
  const [editingQuestion, setEditingQuestion] = useState<EditorQuestion | null | 'new'>(null)
  const [activeSection, setActiveSection] = useState<string>('Geral')

  // UI state
  const [saving, setSaving] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  const hasChanges = name.trim().length > 0 && questions.length > 0

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const gradientClass = isNutritionist
    ? 'from-green-500 to-emerald-600'
    : 'from-orange-500 to-red-600'
  const gradientHoverClass = isNutritionist
    ? 'hover:from-green-600 hover:to-emerald-700'
    : 'hover:from-orange-600 hover:to-red-700'

  // ---- Section handlers ----

  function addSection() {
    const newSection: Section = {
      id: crypto.randomUUID(),
      name: `Seção ${sections.length + 1}`,
    }
    setSections(prev => [...prev, newSection])
    setExpandedSections(prev => [...prev, newSection.id])
  }

  function removeSection(sectionId: string) {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    // Move questions from this section to the first section
    if (sections.length > 1) {
      const firstSection = sections.find(s => s.id !== sectionId)!
      setQuestions(prev =>
        prev.map(q => q.section === section.name ? { ...q, section: firstSection.name } : q)
      )
      setSections(prev => prev.filter(s => s.id !== sectionId))
    }
  }

  function startEditSection(sectionId: string) {
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      setEditingSectionId(sectionId)
      setEditingSectionName(section.name)
    }
  }

  function saveEditSection() {
    if (!editingSectionId || !editingSectionName.trim()) return
    const oldName = sections.find(s => s.id === editingSectionId)?.name
    setSections(prev =>
      prev.map(s => s.id === editingSectionId ? { ...s, name: editingSectionName.trim() } : s)
    )
    // Update questions' section reference
    if (oldName) {
      setQuestions(prev =>
        prev.map(q => q.section === oldName ? { ...q, section: editingSectionName.trim() } : q)
      )
    }
    setEditingSectionId(null)
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    )
  }

  // ---- Question handlers ----

  function openAddQuestion(sectionName: string) {
    setActiveSection(sectionName)
    setEditingQuestion('new')
  }

  function openEditQuestion(question: EditorQuestion) {
    setActiveSection(question.section)
    setEditingQuestion(question)
  }

  function handleSaveQuestion(q: EditorQuestion) {
    const questionWithSection = { ...q, section: activeSection }

    if (editingQuestion === 'new') {
      setQuestions(prev => [...prev, questionWithSection])
    } else {
      setQuestions(prev => prev.map(existing => existing.id === q.id ? questionWithSection : existing))
    }
    setEditingQuestion(null)
  }

  function removeQuestion(questionId: string) {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setQuestions(prev => {
        const oldIndex = prev.findIndex(q => q.id === active.id)
        const newIndex = prev.findIndex(q => q.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    },
    []
  )

  // ---- Save ----

  async function handleSave() {
    if (!hasChanges) return

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        form_type: formType,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          section: q.section || null,
          options: q.options.length > 0 ? q.options.filter(o => o.label.trim()) : null,
          config: Object.keys(q.config).length > 0 ? q.config : {},
        })),
      }

      const response = await fetch('/api/portal/forms/templates/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/portal/forms')
      } else {
        alert(data.error || 'Erro ao salvar template')
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  // ---- Render ----

  if (professionalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado" />
      </div>
    )
  }

  if (!isProfessional) {
    router.push('/portal')
    return null
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/portal/forms')}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-muted" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Novo Template</h1>
            <p className="text-sm text-foreground-secondary">Crie um formulário personalizado</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg ${gradientHoverClass} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Template
            </>
          )}
        </button>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Nome do Template *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Avaliação Inicial Personalizada"
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição do formulário..."
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Tipo do Formulário
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as FormType)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
          >
            {FORM_TYPES.map((type) => (
              <option key={type} value={type}>
                {FORM_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections + Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Perguntas</h2>

        {sections.map((section) => {
          const sectionQuestions = questions.filter(q => q.section === section.name)
          const isExpanded = expandedSections.includes(section.id) || expandedSections.includes('all')

          return (
            <div key={section.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="p-0.5 hover:bg-background-elevated rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground-muted" />
                  )}
                </button>

                {editingSectionId === section.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEditSection(); if (e.key === 'Escape') setEditingSectionId(null) }}
                      autoFocus
                      className="flex-1 px-2 py-1 bg-white border border-border rounded text-sm text-foreground focus:outline-none focus:border-dourado"
                    />
                    <button onClick={saveEditSection} className="text-xs text-dourado hover:text-dourado/80">
                      OK
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-foreground flex-1">
                      {section.name}
                      <span className="ml-2 text-xs text-foreground-muted font-normal">
                        {sectionQuestions.length} pergunta{sectionQuestions.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                    <button
                      onClick={() => startEditSection(section.id)}
                      className="text-xs text-foreground-muted hover:text-foreground px-2 py-1"
                    >
                      Renomear
                    </button>
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 hover:bg-red-500/20 text-foreground-muted hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Questions list */}
              {isExpanded && (
                <div className="p-4 space-y-2">
                  {sectionQuestions.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sectionQuestions.map(q => q.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {sectionQuestions.map((question) => (
                          <SortableQuestion
                            key={question.id}
                            question={question}
                            index={questions.indexOf(question)}
                            onRemove={() => removeQuestion(question.id)}
                            onEdit={() => openEditQuestion(question)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <p className="text-sm text-foreground-muted text-center py-4">
                      Nenhuma pergunta nesta seção
                    </p>
                  )}

                  {/* Add question button */}
                  <button
                    onClick={() => openAddQuestion(section.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-lg text-foreground-muted hover:border-dourado hover:text-dourado transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Pergunta
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Add section button */}
        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-foreground-muted hover:border-dourado hover:text-dourado transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Seção
        </button>
      </div>

      {/* Preview summary */}
      {questions.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground-secondary mb-3">Resumo</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{sections.length}</p>
              <p className="text-xs text-foreground-muted">Seções</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{questions.length}</p>
              <p className="text-xs text-foreground-muted">Perguntas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{questions.filter(q => q.is_required).length}</p>
              <p className="text-xs text-foreground-muted">Obrigatórias</p>
            </div>
          </div>
        </div>
      )}

      {/* Question editor modal */}
      {editingQuestion !== null && (
        <QuestionEditorModal
          question={editingQuestion === 'new' ? null : editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  )
}

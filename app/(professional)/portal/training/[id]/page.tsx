"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Users,
  Calendar,
  Target,
  Dumbbell,
  Clock,
  GripVertical,
  Pencil,
  Video,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import { toast } from 'sonner'

interface Exercise {
  id?: string
  exercise_name: string
  exercise_category?: string
  muscle_group?: string
  sets: number
  reps: string
  rest_seconds: number
  tempo?: string
  weight_suggestion?: string
  rpe_target?: number
  instructions?: string
  video_url?: string
  is_warmup: boolean
  order_index: number
  /** 'reps' (default) ou 'time' (isometria, ex: prancha 30s). */
  set_type?: 'reps' | 'time'
  /** Grupo de circuito: exercícios com mesmo número formam um circuito. */
  circuit_group?: number | null
}

interface TrainingDay {
  id?: string
  day_of_week?: number
  day_number: number
  name: string
  muscle_groups: string[]
  estimated_duration?: number
  warmup_notes?: string
  cooldown_notes?: string
  notes?: string
  order_index: number
  exercises: Exercise[]
}

interface Week {
  id?: string
  week_number: number
  name?: string
  focus?: string
  intensity_modifier: number
  notes?: string
  days: TrainingDay[]
}

interface TrainingProgram {
  id: string
  name: string
  description?: string
  goal?: string
  difficulty?: string
  duration_weeks: number
  days_per_week: number
  session_duration: number
  is_template: boolean
  is_active: boolean
  client_id?: string
  client?: { id: string; nome: string; email: string }
  weeks: Week[]
}

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Força',
  endurance: 'Resistência',
  weight_loss: 'Emagrecimento',
  functional: 'Funcional',
  custom: 'Personalizado'
}

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

const MUSCLE_GROUPS = [
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'forearms', label: 'Antebraço' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'hamstrings', label: 'Posteriores' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'calves', label: 'Panturrilha' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' }
]

export default function TrainingProgramDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isTrainer, loading: professionalLoading } = useProfessional()
  const [program, setProgram] = useState<TrainingProgram | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([])
  const [expandedDays, setExpandedDays] = useState<string[]>([])
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<{ weekIndex: number; dayIndex: number } | null>(null)
  const [editingExercise, setEditingExercise] = useState<{ weekIndex: number; dayIndex: number; exerciseIndex: number; exercise: Exercise } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    if (!professionalLoading && !isTrainer) {
      router.push('/portal')
    }
  }, [isTrainer, professionalLoading, router])

  useEffect(() => {
    fetchProgram()
    fetchClients()
  }, [id])

  async function fetchClients() {
    try {
      const response = await fetch('/api/professional/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  async function fetchProgram() {
    try {
      const response = await fetch(`/api/portal/training-programs/${id}`)
      const data = await response.json()
      if (data.success) {
        const programData = data.program
        // Initialize with one week if empty
        if (!programData.weeks || programData.weeks.length === 0) {
          programData.weeks = [{
            week_number: 1,
            name: 'Semana 1',
            intensity_modifier: 1.0,
            days: []
          }]
        }
        setProgram(programData)
        setExpandedWeeks([0])
      }
    } catch (error) {
      console.error('Erro ao buscar programa:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveProgram() {
    if (!program) return

    setSaving(true)
    try {
      const response = await fetch(`/api/portal/training-programs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: program.name,
          description: program.description,
          goal: program.goal,
          difficulty: program.difficulty,
          durationWeeks: program.duration_weeks,
          daysPerWeek: program.days_per_week,
          sessionDuration: program.session_duration,
          weeks: program.weeks.map((week, weekIdx) => ({
            weekNumber: weekIdx + 1,
            name: week.name,
            focus: week.focus,
            intensityModifier: week.intensity_modifier,
            notes: week.notes,
            days: week.days.map((day, dayIdx) => ({
              dayNumber: dayIdx + 1,
              dayOfWeek: day.day_of_week,
              name: day.name,
              muscleGroups: day.muscle_groups,
              estimatedDuration: day.estimated_duration,
              warmupNotes: day.warmup_notes,
              cooldownNotes: day.cooldown_notes,
              notes: day.notes,
              orderIndex: dayIdx,
              exercises: day.exercises.map((ex, exIdx) => ({
                exerciseName: ex.exercise_name,
                exerciseCategory: ex.exercise_category,
                muscleGroup: ex.muscle_group,
                sets: ex.sets,
                reps: ex.reps,
                restSeconds: ex.rest_seconds,
                tempo: ex.tempo,
                weightSuggestion: ex.weight_suggestion,
                rpeTarget: ex.rpe_target,
                instructions: ex.instructions,
                videoUrl: ex.video_url,
                isWarmup: ex.is_warmup,
                orderIndex: exIdx
              }))
            }))
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        setHasChanges(false)
        toast.success('Programa salvo com sucesso!')
      } else {
        toast.error('Erro ao salvar: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar programa:', error)
      toast.error('Erro ao salvar programa')
    } finally {
      setSaving(false)
    }
  }

  function toggleWeek(weekIndex: number) {
    setExpandedWeeks(prev =>
      prev.includes(weekIndex)
        ? prev.filter(w => w !== weekIndex)
        : [...prev, weekIndex]
    )
  }

  function toggleDay(key: string) {
    setExpandedDays(prev =>
      prev.includes(key)
        ? prev.filter(d => d !== key)
        : [...prev, key]
    )
  }

  function addWeek() {
    if (!program) return

    const newWeek: Week = {
      week_number: program.weeks.length + 1,
      name: `Semana ${program.weeks.length + 1}`,
      intensity_modifier: 1.0,
      days: []
    }

    setProgram({
      ...program,
      weeks: [...program.weeks, newWeek]
    })
    setHasChanges(true)
    setExpandedWeeks([...expandedWeeks, program.weeks.length])
  }

  function removeWeek(weekIndex: number) {
    if (!program) return

    const newWeeks = program.weeks.filter((_, i) => i !== weekIndex)
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function addDay(weekIndex: number) {
    if (!program) return

    const newDay: TrainingDay = {
      day_number: program.weeks[weekIndex].days.length + 1,
      name: `Treino ${String.fromCharCode(65 + program.weeks[weekIndex].days.length)}`,
      muscle_groups: [],
      order_index: program.weeks[weekIndex].days.length,
      exercises: []
    }

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days.push(newDay)
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)

    const dayKey = `${weekIndex}-${newWeeks[weekIndex].days.length - 1}`
    setExpandedDays([...expandedDays, dayKey])
  }

  function removeDay(weekIndex: number, dayIndex: number) {
    if (!program) return

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days.splice(dayIndex, 1)
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function addExercise(weekIndex: number, dayIndex: number, exercise: Exercise) {
    if (!program) return

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].exercises.push(exercise)
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
    setShowAddExerciseModal(null)
  }

  function removeExercise(weekIndex: number, dayIndex: number, exerciseIndex: number) {
    if (!program) return
    if (!confirm('Remover este exercício?')) return

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].exercises.splice(exerciseIndex, 1)
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function updateExercise(weekIndex: number, dayIndex: number, exerciseIndex: number, exercise: Exercise) {
    if (!program) return

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex] = {
      ...newWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex],
      ...exercise,
    }
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
    setEditingExercise(null)
  }

  function moveExercise(weekIndex: number, dayIndex: number, exerciseIndex: number, direction: 'up' | 'down') {
    if (!program) return

    const exercises = program.weeks[weekIndex].days[dayIndex].exercises
    const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1
    if (targetIndex < 0 || targetIndex >= exercises.length) return

    const newWeeks = [...program.weeks]
    const reordered = [...exercises]
    ;[reordered[exerciseIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[exerciseIndex]]
    newWeeks[weekIndex].days[dayIndex].exercises = reordered
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function updateDayName(weekIndex: number, dayIndex: number, name: string) {
    if (!program) return

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].name = name
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function updateDayOfWeek(weekIndex: number, dayIndex: number, value: string) {
    if (!program) return

    const parsedValue = value === '' ? undefined : parseInt(value, 10)

    if (parsedValue !== undefined) {
      const conflict = program.weeks[weekIndex].days.some(
        (d, idx) => idx !== dayIndex && d.day_of_week === parsedValue
      )
      if (conflict) {
        const dayLabel = WEEKDAY_OPTIONS.find(o => o.value === parsedValue)?.label ?? 'este dia'
        toast.warning(`Já existe um treino para ${dayLabel} nesta semana.`, {
          description: 'Você pode manter mais de um treino no mesmo dia se quiser.',
        })
      }
    }

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].day_of_week = parsedValue
    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  function hasDayOfWeekConflict(weekIndex: number, dayIndex: number): boolean {
    if (!program) return false
    const day = program.weeks[weekIndex].days[dayIndex]
    if (day.day_of_week === undefined) return false
    return program.weeks[weekIndex].days.some(
      (d, idx) => idx !== dayIndex && d.day_of_week === day.day_of_week
    )
  }

  function copyWeekToAll(fromWeekIndex: number) {
    if (!program) return

    const sourceDays = program.weeks[fromWeekIndex].days
    const newWeeks = program.weeks.map((week, idx) => {
      if (idx === fromWeekIndex) return week
      return {
        ...week,
        days: JSON.parse(JSON.stringify(sourceDays))
      }
    })

    setProgram({ ...program, weeks: newWeeks })
    setHasChanges(true)
  }

  async function assignClient(clientId: string | null) {
    if (!program) return

    try {
      const response = await fetch('/api/portal/training-programs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program.id,
          clientId: clientId
        })
      })

      const data = await response.json()
      if (data.success) {
        // Usar os dados retornados pela API para garantir sincronização
        const updatedProgram = data.program
        setProgram({
          ...program,
          client_id: updatedProgram.client_id || undefined,
          client: updatedProgram.client || undefined
        })
        setShowClientModal(false)
        toast.success('Cliente atualizado com sucesso!')
      } else {
        toast.error('Erro ao atribuir cliente: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atribuir cliente:', error)
      toast.error('Erro ao atribuir cliente')
    }
  }

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-secondary">Programa não encontrado</p>
        <Link href="/portal/training" className="text-dourado hover:text-dourado/80 mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/training"
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-foreground bg-white border border-border rounded-lg px-3 py-1 focus:outline-none focus:border-dourado"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editedName.trim()) {
                          setProgram({ ...program, name: editedName.trim() })
                          setHasChanges(true)
                        }
                        setIsEditingName(false)
                      } else if (e.key === 'Escape') {
                        setIsEditingName(false)
                        setEditedName(program.name)
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (editedName.trim()) {
                        setProgram({ ...program, name: editedName.trim() })
                        setHasChanges(true)
                      }
                      setIsEditingName(false)
                    }}
                    className="p-1.5 hover:bg-green-500/20 rounded text-green-400"
                    title="Confirmar"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setEditedName(program.name)
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                    title="Cancelar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
                  <button
                    onClick={() => {
                      setEditedName(program.name)
                      setIsEditingName(true)
                    }}
                    className="p-1.5 hover:bg-background-elevated rounded text-foreground-secondary hover:text-foreground transition-colors"
                    title="Editar nome"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-secondary">
              {program.is_template && (
                <span className="px-2 py-0.5 bg-dourado/20 text-dourado rounded-full text-xs">
                  Template
                </span>
              )}
              {program.goal && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {GOAL_LABELS[program.goal]}
                </span>
              )}
              {program.client && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {program.client.nome}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={saveProgram}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Program Info */}
      <div className="bg-white rounded-xl p-4 border border-border">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-foreground-secondary" />
            <span className="text-foreground">{program.duration_weeks} semanas</span>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-foreground-secondary" />
            <span className="text-foreground">{program.days_per_week}x por semana</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-foreground-secondary" />
            <span className="text-foreground">{program.session_duration} min/sessão</span>
          </div>
        </div>
      </div>

      {/* Client Assignment */}
      {!program.is_template && (
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Cliente Atribuído</h3>
                {program.client ? (
                  <p className="text-foreground font-medium">{program.client.nome}</p>
                ) : (
                  <p className="text-orange-400">Nenhum cliente atribuído</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowClientModal(true)}
              className="px-3 py-1.5 bg-background-elevated text-foreground-secondary rounded-lg hover:bg-border transition-colors text-sm"
            >
              {program.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
            </button>
          </div>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-4">
        {program.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Week Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-elevated"
              onClick={() => toggleWeek(weekIndex)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dourado/20 flex items-center justify-center">
                  <span className="text-dourado font-bold">{weekIndex + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{week.name || `Semana ${weekIndex + 1}`}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {week.days.length} {week.days.length === 1 ? 'treino' : 'treinos'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {week.days.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyWeekToAll(weekIndex)
                    }}
                    className="px-2 py-1 text-xs bg-background-elevated text-foreground-secondary rounded hover:bg-border"
                  >
                    Copiar para todas
                  </button>
                )}
                {program.weeks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWeek(weekIndex)
                    }}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {expandedWeeks.includes(weekIndex) ? (
                  <ChevronUp className="w-5 h-5 text-foreground-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-foreground-secondary" />
                )}
              </div>
            </div>

            {/* Week Content */}
            {expandedWeeks.includes(weekIndex) && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Days */}
                {week.days.length === 0 ? (
                  <p className="text-center text-foreground-secondary py-4">
                    Nenhum dia de treino adicionado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {week.days.map((day, dayIndex) => {
                      const dayKey = `${weekIndex}-${dayIndex}`
                      return (
                        <div key={dayIndex} className="bg-background-elevated rounded-lg overflow-hidden">
                          {/* Day Header */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-border/50 gap-2"
                            onClick={() => toggleDay(dayKey)}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                              <input
                                type="text"
                                value={day.name}
                                onChange={(e) => updateDayName(weekIndex, dayIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent text-foreground font-medium focus:outline-none focus:bg-white px-2 py-1 rounded min-w-0 max-w-[160px]"
                              />
                              <select
                                value={day.day_of_week ?? ''}
                                onChange={(e) => updateDayOfWeek(weekIndex, dayIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`bg-white border text-xs rounded px-2 py-1 focus:outline-none ${
                                  hasDayOfWeekConflict(weekIndex, dayIndex)
                                    ? 'border-orange-500 text-orange-600 focus:border-orange-500'
                                    : 'border-border text-foreground focus:border-dourado'
                                }`}
                                title={
                                  hasDayOfWeekConflict(weekIndex, dayIndex)
                                    ? 'Já existe outro treino marcado para este dia'
                                    : 'Dia da semana em que este treino será executado'
                                }
                              >
                                <option value="">Auto (sequência)</option>
                                {WEEKDAY_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {hasDayOfWeekConflict(weekIndex, dayIndex) && (
                                <span
                                  className="text-xs text-orange-600 italic"
                                  title="Outro treino já está marcado para este dia"
                                >
                                  duplicado
                                </span>
                              )}
                              <span className="text-xs text-foreground-secondary">
                                {day.exercises.length} exercícios
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeDay(weekIndex, dayIndex)
                                }}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {expandedDays.includes(dayKey) ? (
                                <ChevronUp className="w-4 h-4 text-foreground-secondary" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-foreground-secondary" />
                              )}
                            </div>
                          </div>

                          {/* Day Content */}
                          {expandedDays.includes(dayKey) && (
                            <div className="border-t border-border p-3 space-y-3">
                              {/* Exercises */}
                              {day.exercises.length > 0 && (
                                <div className="space-y-2">
                                  {day.exercises.map((exercise, exIndex) => {
                                    // Detecta se faz parte de circuito + se é o primeiro/último do grupo
                                    // (pra agrupar visualmente com bordas)
                                    const cg = exercise.circuit_group ?? null
                                    const prevCg = exIndex > 0 ? (day.exercises[exIndex - 1].circuit_group ?? null) : null
                                    const nextCg = exIndex < day.exercises.length - 1 ? (day.exercises[exIndex + 1].circuit_group ?? null) : null
                                    const inCircuit = cg != null
                                    const isFirstOfCircuit = inCircuit && cg !== prevCg
                                    const isLastOfCircuit = inCircuit && cg !== nextCg

                                    return (
                                    <div
                                      key={exIndex}
                                      className={`flex items-center justify-between bg-white border px-3 py-2 gap-2 ${
                                        inCircuit
                                          ? `border-l-4 border-l-vinho border-r-border border-y-border ${
                                              isFirstOfCircuit && isLastOfCircuit
                                                ? 'rounded-lg'
                                                : isFirstOfCircuit
                                                  ? 'rounded-t-lg border-b-0'
                                                  : isLastOfCircuit
                                                    ? 'rounded-b-lg'
                                                    : 'border-b-0'
                                            }`
                                          : 'border-border rounded-lg'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <GripVertical className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                                            <span className="truncate">{exercise.exercise_name}</span>
                                            {exercise.video_url && (
                                              <span className="inline-flex items-center flex-shrink-0" title="Vídeo configurado">
                                                <Video className="w-3.5 h-3.5 text-dourado" />
                                              </span>
                                            )}
                                            {inCircuit && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-vinho/10 text-vinho border border-vinho/30">
                                                🔗 Circuito {cg}
                                              </span>
                                            )}
                                            {exercise.set_type === 'time' && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-dourado/15 text-dourado border border-dourado/30">
                                                ⏱ Tempo
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-xs text-foreground-secondary truncate">
                                            {exercise.sets} x {exercise.reps}{exercise.set_type === 'time' ? 's' : ''} | {exercise.rest_seconds}s descanso
                                            {exercise.is_warmup && ' • aquecimento'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 flex-shrink-0">
                                        <button
                                          onClick={() => moveExercise(weekIndex, dayIndex, exIndex, 'up')}
                                          disabled={exIndex === 0}
                                          className="p-1.5 rounded text-foreground-secondary hover:text-foreground hover:bg-background-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                          title="Mover para cima"
                                          aria-label="Mover exercício para cima"
                                        >
                                          <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => moveExercise(weekIndex, dayIndex, exIndex, 'down')}
                                          disabled={exIndex === day.exercises.length - 1}
                                          className="p-1.5 rounded text-foreground-secondary hover:text-foreground hover:bg-background-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                          title="Mover para baixo"
                                          aria-label="Mover exercício para baixo"
                                        >
                                          <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setEditingExercise({ weekIndex, dayIndex, exerciseIndex: exIndex, exercise })}
                                          className="p-1.5 rounded text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                          title="Editar exercício"
                                          aria-label="Editar exercício"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => removeExercise(weekIndex, dayIndex, exIndex)}
                                          className="p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                          title="Remover exercício"
                                          aria-label="Remover exercício"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    )
                                  })}
                                </div>
                              )}

                              <button
                                onClick={() => setShowAddExerciseModal({ weekIndex, dayIndex })}
                                className="w-full flex items-center justify-center gap-1 py-2 border border-dashed border-border rounded text-foreground-muted hover:border-dourado hover:text-dourado"
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar Exercício
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add Day Button */}
                <button
                  onClick={() => addDay(weekIndex)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-foreground-muted hover:border-dourado hover:text-dourado transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Dia de Treino
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Week Button */}
        <button
          onClick={addWeek}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-foreground-muted hover:border-dourado hover:text-dourado transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Semana
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <ExerciseFormModal
          mode="add"
          onClose={() => setShowAddExerciseModal(null)}
          onSave={(exercise) => addExercise(
            showAddExerciseModal.weekIndex,
            showAddExerciseModal.dayIndex,
            exercise
          )}
        />
      )}

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <ExerciseFormModal
          mode="edit"
          initialExercise={editingExercise.exercise}
          onClose={() => setEditingExercise(null)}
          onSave={(exercise) => updateExercise(
            editingExercise.weekIndex,
            editingExercise.dayIndex,
            editingExercise.exerciseIndex,
            exercise
          )}
        />
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 my-8 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {program.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="p-1 hover:bg-background-elevated rounded">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {/* Opção para remover atribuição */}
              {program.client && (
                <button
                  onClick={() => assignClient(null)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 font-medium">Remover atribuição</p>
                    <p className="text-xs text-foreground-secondary">Este treino ficará sem cliente</p>
                  </div>
                </button>
              )}

              {/* Lista de clientes */}
              {clients.length === 0 ? (
                <p className="text-center text-foreground-secondary py-4">
                  Nenhum cliente encontrado
                </p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => assignClient(client.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      program.client_id === client.id
                        ? 'border-dourado bg-dourado/10'
                        : 'border-border hover:border-foreground-muted hover:bg-background-elevated'
                    }`}
                  >
                    {client.avatar_url ? (
                      <img
                        src={client.avatar_url}
                        alt={client.nome}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-background-elevated flex items-center justify-center">
                        <span className="text-foreground font-medium">
                          {client.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-foreground font-medium">{client.nome}</p>
                      <p className="text-xs text-foreground-secondary">{client.email}</p>
                    </div>
                    {program.client_id === client.id && (
                      <Check className="w-5 h-5 text-dourado ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setShowClientModal(false)}
                className="w-full px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Exercise Form Modal Component (handles both add and edit)
function ExerciseFormModal({
  mode,
  initialExercise,
  onClose,
  onSave
}: {
  mode: 'add' | 'edit'
  initialExercise?: Exercise
  onClose: () => void
  onSave: (exercise: Exercise) => void
}) {
  const [formData, setFormData] = useState(() => ({
    exercise_name: initialExercise?.exercise_name ?? '',
    muscle_group: initialExercise?.muscle_group ?? '',
    sets: initialExercise?.sets?.toString() ?? '3',
    reps: initialExercise?.reps ?? '10-12',
    rest_seconds: initialExercise?.rest_seconds?.toString() ?? '60',
    tempo: initialExercise?.tempo ?? '',
    weight_suggestion: initialExercise?.weight_suggestion ?? '',
    rpe_target: initialExercise?.rpe_target?.toString() ?? '',
    instructions: initialExercise?.instructions ?? '',
    video_url: initialExercise?.video_url ?? '',
    is_warmup: initialExercise?.is_warmup ?? false,
    set_type: initialExercise?.set_type ?? 'reps' as 'reps' | 'time',
    circuit_group: initialExercise?.circuit_group?.toString() ?? '',
  }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.exercise_name) return

    onSave({
      exercise_name: formData.exercise_name,
      muscle_group: formData.muscle_group,
      sets: parseInt(formData.sets) || 3,
      reps: formData.reps || (formData.set_type === 'time' ? '30' : '10-12'),
      rest_seconds: parseInt(formData.rest_seconds) || 60,
      tempo: formData.tempo,
      weight_suggestion: formData.weight_suggestion,
      rpe_target: formData.rpe_target ? parseInt(formData.rpe_target) : undefined,
      instructions: formData.instructions,
      video_url: formData.video_url.trim() || undefined,
      is_warmup: formData.is_warmup,
      order_index: initialExercise?.order_index ?? 0,
      set_type: formData.set_type,
      circuit_group: formData.circuit_group ? parseInt(formData.circuit_group) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full p-6 my-8 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {mode === 'edit' ? 'Editar Exercício' : 'Adicionar Exercício'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nome do Exercício *
            </label>
            <input
              type="text"
              value={formData.exercise_name}
              onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
              placeholder="Ex: Supino Reto"
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Grupo Muscular
            </label>
            <select
              value={formData.muscle_group}
              onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
            >
              <option value="">Selecione...</option>
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg.value} value={mg.value}>{mg.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo da série: repetição vs tempo (isometria) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tipo da série
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, set_type: 'reps' })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.set_type === 'reps'
                    ? 'bg-dourado text-white'
                    : 'bg-background-elevated text-foreground-muted hover:bg-border'
                }`}
              >
                Repetições
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, set_type: 'time' })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.set_type === 'time'
                    ? 'bg-dourado text-white'
                    : 'bg-background-elevated text-foreground-muted hover:bg-border'
                }`}
              >
                Tempo (isometria)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-foreground-secondary mb-1">Séries</label>
              <input
                type="number"
                min="1"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-secondary mb-1">
                {formData.set_type === 'time' ? 'Segundos' : 'Reps'}
              </label>
              <input
                type="text"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder={formData.set_type === 'time' ? '30' : '10-12'}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-secondary mb-1">Descanso (s)</label>
              <input
                type="number"
                min="0"
                value={formData.rest_seconds}
                onChange={(e) => setFormData({ ...formData, rest_seconds: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-foreground-secondary mb-1">Carga Sugerida</label>
              <input
                type="text"
                value={formData.weight_suggestion}
                onChange={(e) => setFormData({ ...formData, weight_suggestion: e.target.value })}
                placeholder="20kg, 70% 1RM"
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-secondary mb-1">RPE (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.rpe_target}
                onChange={(e) => setFormData({ ...formData, rpe_target: e.target.value })}
                placeholder="8"
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-foreground-secondary mb-1">Instruções</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Dicas de execução..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground-secondary mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-dourado" />
              Link do vídeo (YouTube)
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
            />
            <p className="text-xs text-foreground-muted mt-1">
              O paciente verá o vídeo dentro do app ao clicar em &ldquo;Como fazer&rdquo;.
            </p>
          </div>

          {/* Circuito: agrupar com outros exercícios */}
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">
              Circuito (opcional)
            </label>
            <input
              type="number"
              min="0"
              value={formData.circuit_group}
              onChange={(e) => setFormData({ ...formData, circuit_group: e.target.value })}
              placeholder="Vazio = exercício solo"
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado"
            />
            <p className="text-xs text-foreground-muted mt-1">
              Exercícios com o mesmo número formam um circuito (executados em sequência sem descanso entre eles).
              Ex: marque 1 nos 3 exercícios do bi/tri-set.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_warmup}
              onChange={(e) => setFormData({ ...formData, is_warmup: e.target.checked })}
              className="w-4 h-4 rounded border-border text-dourado focus:ring-dourado/50 bg-white"
            />
            <span className="text-sm text-foreground">Exercício de aquecimento</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/90 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {mode === 'edit' ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

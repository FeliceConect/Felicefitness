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
  Pencil
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

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
  is_warmup: boolean
  order_index: number
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
        alert('Programa salvo com sucesso!')
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar programa:', error)
      alert('Erro ao salvar programa')
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

    const newWeeks = [...program.weeks]
    newWeeks[weekIndex].days[dayIndex].exercises.splice(exerciseIndex, 1)
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
      console.log('Resposta da API:', data)

      if (data.success) {
        // Usar os dados retornados pela API para garantir sincronização
        const updatedProgram = data.program
        setProgram({
          ...program,
          client_id: updatedProgram.client_id || undefined,
          client: updatedProgram.client || undefined
        })
        setShowClientModal(false)
        alert('Cliente atualizado com sucesso!')
      } else {
        alert('Erro ao atribuir cliente: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atribuir cliente:', error)
      alert('Erro ao atribuir cliente')
    }
  }

  if (professionalLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Programa não encontrado</p>
        <Link href="/portal/training" className="text-violet-400 hover:text-violet-300 mt-4 inline-block">
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
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-white bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 focus:outline-none focus:border-violet-500"
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
                  <h1 className="text-2xl font-bold text-white">{program.name}</h1>
                  <button
                    onClick={() => {
                      setEditedName(program.name)
                      setIsEditingName(true)
                    }}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Editar nome"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              {program.is_template && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{program.duration_weeks} semanas</span>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{program.days_per_week}x por semana</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{program.session_duration} min/sessão</span>
          </div>
        </div>
      </div>

      {/* Client Assignment */}
      {!program.is_template && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-300">Cliente Atribuído</h3>
                {program.client ? (
                  <p className="text-white font-medium">{program.client.nome}</p>
                ) : (
                  <p className="text-orange-400">Nenhum cliente atribuído</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowClientModal(true)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              {program.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
            </button>
          </div>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-4">
        {program.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Week Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50"
              onClick={() => toggleWeek(weekIndex)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 font-bold">{weekIndex + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{week.name || `Semana ${weekIndex + 1}`}</h3>
                  <p className="text-sm text-slate-400">
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
                    className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
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
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Week Content */}
            {expandedWeeks.includes(weekIndex) && (
              <div className="border-t border-slate-700 p-4 space-y-4">
                {/* Days */}
                {week.days.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">
                    Nenhum dia de treino adicionado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {week.days.map((day, dayIndex) => {
                      const dayKey = `${weekIndex}-${dayIndex}`
                      return (
                        <div key={dayIndex} className="bg-slate-700/50 rounded-lg overflow-hidden">
                          {/* Day Header */}
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700"
                            onClick={() => toggleDay(dayKey)}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={day.name}
                                onChange={(e) => updateDayName(weekIndex, dayIndex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent text-white font-medium focus:outline-none focus:bg-slate-600 px-2 py-1 rounded"
                              />
                              <span className="text-xs text-slate-400">
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
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Day Content */}
                          {expandedDays.includes(dayKey) && (
                            <div className="border-t border-slate-600 p-3 space-y-3">
                              {/* Exercises */}
                              {day.exercises.length > 0 && (
                                <div className="space-y-2">
                                  {day.exercises.map((exercise, exIndex) => (
                                    <div
                                      key={exIndex}
                                      className="flex items-center justify-between bg-slate-800 rounded px-3 py-2"
                                    >
                                      <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-slate-500" />
                                        <div>
                                          <p className="text-white text-sm">{exercise.exercise_name}</p>
                                          <p className="text-xs text-slate-400">
                                            {exercise.sets} x {exercise.reps} | {exercise.rest_seconds}s descanso
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeExercise(weekIndex, dayIndex, exIndex)}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => setShowAddExerciseModal({ weekIndex, dayIndex })}
                                className="w-full flex items-center justify-center gap-1 py-2 border border-dashed border-slate-500 rounded text-slate-400 hover:border-orange-500 hover:text-orange-400"
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
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
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
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Semana
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowAddExerciseModal(null)}
          onAdd={(exercise) => addExercise(
            showAddExerciseModal.weekIndex,
            showAddExerciseModal.dayIndex,
            exercise
          )}
        />
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {program.client ? 'Trocar Cliente' : 'Atribuir Cliente'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
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
                    <p className="text-xs text-slate-400">Este treino ficará sem cliente</p>
                  </div>
                </button>
              )}

              {/* Lista de clientes */}
              {clients.length === 0 ? (
                <p className="text-center text-slate-400 py-4">
                  Nenhum cliente encontrado
                </p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => assignClient(client.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      program.client_id === client.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    {client.avatar_url ? (
                      <img
                        src={client.avatar_url}
                        alt={client.nome}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-slate-300 font-medium">
                          {client.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{client.nome}</p>
                      <p className="text-xs text-slate-400">{client.email}</p>
                    </div>
                    {program.client_id === client.id && (
                      <Check className="w-5 h-5 text-blue-400 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => setShowClientModal(false)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
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

// Add Exercise Modal Component
function AddExerciseModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (exercise: Exercise) => void
}) {
  const [formData, setFormData] = useState({
    exercise_name: '',
    muscle_group: '',
    sets: '3',
    reps: '10-12',
    rest_seconds: '60',
    tempo: '',
    weight_suggestion: '',
    rpe_target: '',
    instructions: '',
    is_warmup: false
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.exercise_name) return

    onAdd({
      exercise_name: formData.exercise_name,
      muscle_group: formData.muscle_group,
      sets: parseInt(formData.sets) || 3,
      reps: formData.reps || '10-12',
      rest_seconds: parseInt(formData.rest_seconds) || 60,
      tempo: formData.tempo,
      weight_suggestion: formData.weight_suggestion,
      rpe_target: formData.rpe_target ? parseInt(formData.rpe_target) : undefined,
      instructions: formData.instructions,
      is_warmup: formData.is_warmup,
      order_index: 0
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Adicionar Exercício</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Exercício *
            </label>
            <input
              type="text"
              value={formData.exercise_name}
              onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
              placeholder="Ex: Supino Reto"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Grupo Muscular
            </label>
            <select
              value={formData.muscle_group}
              onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Selecione...</option>
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg.value} value={mg.value}>{mg.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Séries</label>
              <input
                type="number"
                min="1"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reps</label>
              <input
                type="text"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder="10-12"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Descanso (s)</label>
              <input
                type="number"
                min="0"
                value={formData.rest_seconds}
                onChange={(e) => setFormData({ ...formData, rest_seconds: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Carga Sugerida</label>
              <input
                type="text"
                value={formData.weight_suggestion}
                onChange={(e) => setFormData({ ...formData, weight_suggestion: e.target.value })}
                placeholder="20kg, 70% 1RM"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">RPE (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.rpe_target}
                onChange={(e) => setFormData({ ...formData, rpe_target: e.target.value })}
                placeholder="8"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Instruções</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Dicas de execução..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_warmup}
              onChange={(e) => setFormData({ ...formData, is_warmup: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-orange-500 bg-slate-700"
            />
            <span className="text-sm text-slate-300">Exercício de aquecimento</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

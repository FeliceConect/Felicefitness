"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Clock, ChevronDown, Save } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useWorkoutTemplates } from '@/hooks/use-workout-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { WorkoutType, WorkoutPhase, WorkoutTemplate, TemplateExercise } from '@/lib/workout/types'

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

const tiposTreino: { value: WorkoutType; label: string; icon: string; description: string }[] = [
  { value: 'tradicional', label: 'Tradicional', icon: '🏋️', description: 'Séries e repetições clássicas' },
  { value: 'circuito', label: 'Circuito', icon: '🔄', description: 'Exercícios em sequência' },
  { value: 'hiit', label: 'HIIT', icon: '🔥', description: 'Alta intensidade intervalado' },
  { value: 'mobilidade', label: 'Mobilidade', icon: '🧘', description: 'Flexibilidade e mobilidade' },
]

const fases: { value: WorkoutPhase; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'construcao', label: 'Construção' },
  { value: 'pico', label: 'Pico' },
]

interface ExerciseForm {
  id: string
  nome: string
  series: number
  repeticoes: string
  descanso: number
  carga_sugerida?: number
  notas?: string
  isNew?: boolean
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const {
    getTemplateById,
    updateTemplate,
    addExerciseToTemplate,
    removeExerciseFromTemplate,
    reorderExercises
  } = useWorkoutTemplates()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [showExerciseForm, setShowExerciseForm] = useState(false)

  // Form state
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<WorkoutType>('tradicional')
  const [fase, setFase] = useState<WorkoutPhase>('base')
  const [diaSemana, setDiaSemana] = useState(1)
  const [duracaoEstimada, setDuracaoEstimada] = useState(60)
  const [exercicios, setExercicios] = useState<ExerciseForm[]>([])

  // New exercise form
  const [novoExercicio, setNovoExercicio] = useState<ExerciseForm>({
    id: '',
    nome: '',
    series: 3,
    repeticoes: '12',
    descanso: 60,
    carga_sugerida: undefined,
    notas: ''
  })

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await getTemplateById(templateId)
        if (data) {
          setTemplate(data)
          setNome(data.nome)
          setTipo(data.tipo)
          setFase(data.fase)
          setDiaSemana(data.dia_semana)
          setDuracaoEstimada(data.duracao_estimada)
          setExercicios(data.exercicios.map(e => ({
            id: e.id,
            nome: e.nome,
            series: e.series,
            repeticoes: e.repeticoes,
            descanso: e.descanso,
            carga_sugerida: e.carga_sugerida,
            notas: e.notas
          })))
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId, getTemplateById])

  const addExercise = async () => {
    if (!novoExercicio.nome.trim()) return

    const newExercise: Omit<TemplateExercise, 'id'> = {
      exercise_id: crypto.randomUUID(),
      nome: novoExercicio.nome,
      ordem: exercicios.length,
      series: novoExercicio.series,
      repeticoes: novoExercicio.repeticoes,
      descanso: novoExercicio.descanso,
      carga_sugerida: novoExercicio.carga_sugerida,
      notas: novoExercicio.notas
    }

    try {
      await addExerciseToTemplate(templateId, newExercise)

      setExercicios(prev => [...prev, {
        ...novoExercicio,
        id: crypto.randomUUID(),
        isNew: true
      }])

      setNovoExercicio({
        id: '',
        nome: '',
        series: 3,
        repeticoes: '12',
        descanso: 60,
        carga_sugerida: undefined,
        notas: ''
      })
      setShowExerciseForm(false)
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error)
    }
  }

  const removeExercise = async (id: string) => {
    try {
      await removeExerciseFromTemplate(templateId, id)
      setExercicios(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Erro ao remover exercício:', error)
    }
  }

  const moveExercise = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= exercicios.length) return

    const newExercicios = [...exercicios]
    const [removed] = newExercicios.splice(index, 1)
    newExercicios.splice(newIndex, 0, removed)
    setExercicios(newExercicios)

    try {
      await reorderExercises(templateId, newExercicios.map(e => e.id))
    } catch (error) {
      console.error('Erro ao reordenar exercícios:', error)
    }
  }

  const handleSubmit = async () => {
    if (!nome.trim()) {
      alert('Digite o nome do treino')
      return
    }

    setSaving(true)
    try {
      await updateTemplate(templateId, {
        nome,
        tipo,
        fase,
        dia_semana: diaSemana,
        duracao_estimada: duracaoEstimada
      })

      router.push('/treino/templates')
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      alert('Erro ao salvar treino. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dourado animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">Carregando treino...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-secondary">Treino não encontrado</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push('/treino/templates')}
          >
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground">Editar Treino</h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Atualize seu template de treino
        </p>
      </div>

      {/* Form */}
      <div className="px-4 space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do treino</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Treino A - Peito e Tríceps"
            className="bg-white border-border"
          />
        </div>

        {/* Tipo de treino */}
        <div className="space-y-3">
          <Label>Tipo de treino</Label>
          <div className="grid grid-cols-2 gap-3">
            {tiposTreino.map((t) => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  tipo === t.value
                    ? 'bg-dourado/20 border-dourado/50'
                    : 'bg-white border-border hover:border-dourado/30'
                )}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="font-medium text-foreground mt-2">{t.label}</p>
                <p className="text-xs text-foreground-secondary mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dia da semana */}
        <div className="space-y-2">
          <Label>Dia da semana</Label>
          <div className="relative">
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(Number(e.target.value))}
              className="w-full bg-white border border-border rounded-lg px-4 py-3 text-foreground appearance-none cursor-pointer"
            >
              {diasSemana.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary pointer-events-none" />
          </div>
        </div>

        {/* Fase e Duração */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fase</Label>
            <div className="relative">
              <select
                value={fase}
                onChange={(e) => setFase(e.target.value as WorkoutPhase)}
                className="w-full bg-white border border-border rounded-lg px-4 py-3 text-foreground appearance-none cursor-pointer"
              >
                {fases.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração (min)</Label>
            <div className="relative">
              <Input
                type="number"
                value={duracaoEstimada}
                onChange={(e) => setDuracaoEstimada(Number(e.target.value))}
                min={10}
                max={180}
                className="bg-white border-border pr-12"
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            </div>
          </div>
        </div>

        {/* Exercícios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Exercícios ({exercicios.length})</Label>
          </div>

          {/* Lista de exercícios */}
          {exercicios.length > 0 && (
            <div className="space-y-2">
              {exercicios.map((ex, index) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-background-elevated rounded disabled:opacity-30"
                      >
                        <GripVertical className="w-4 h-4 text-foreground-muted" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-foreground">{ex.nome}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-foreground-secondary">
                        <span>{ex.series} séries</span>
                        <span>×</span>
                        <span>{ex.repeticoes} reps</span>
                        <span>•</span>
                        <span>{ex.descanso}s descanso</span>
                        {ex.carga_sugerida && (
                          <>
                            <span>•</span>
                            <span>{ex.carga_sugerida}kg</span>
                          </>
                        )}
                      </div>
                      {ex.notas && (
                        <p className="text-xs text-foreground-muted mt-1">{ex.notas}</p>
                      )}
                    </div>

                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Form para adicionar exercício */}
          {showExerciseForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-dourado/30 rounded-xl p-4 space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome do exercício</Label>
                <Input
                  value={novoExercicio.nome}
                  onChange={(e) => setNovoExercicio(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Supino Reto"
                  className="bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Séries</Label>
                  <Input
                    type="number"
                    value={novoExercicio.series}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, series: Number(e.target.value) }))}
                    min={1}
                    max={10}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Repetições</Label>
                  <Input
                    value={novoExercicio.repeticoes}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, repeticoes: e.target.value }))}
                    placeholder="12"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descanso (s)</Label>
                  <Input
                    type="number"
                    value={novoExercicio.descanso}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, descanso: Number(e.target.value) }))}
                    min={10}
                    max={300}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Carga sugerida (kg)</Label>
                  <Input
                    type="number"
                    value={novoExercicio.carga_sugerida || ''}
                    onChange={(e) => setNovoExercicio(prev => ({
                      ...prev,
                      carga_sugerida: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    placeholder="Opcional"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input
                    value={novoExercicio.notas || ''}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Opcional"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowExerciseForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={addExercise}
                  disabled={!novoExercicio.nome.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowExerciseForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Exercício
            </Button>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || !nome.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

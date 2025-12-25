"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Clock, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWorkoutTemplates } from '@/hooks/use-workout-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { WorkoutType, WorkoutPhase, TemplateExercise } from '@/lib/workout/types'

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
}

export default function NovoTemplatePage() {
  const router = useRouter()
  const { createTemplate } = useWorkoutTemplates()
  const [loading, setLoading] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)

  // Form state
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<WorkoutType>('tradicional')
  const [fase, setFase] = useState<WorkoutPhase>('base')
  const [diaSemana, setDiaSemana] = useState(1) // Segunda por padrão
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

  const addExercise = () => {
    if (!novoExercicio.nome.trim()) return

    setExercicios(prev => [...prev, {
      ...novoExercicio,
      id: crypto.randomUUID()
    }])

    // Reset form
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
  }

  const removeExercise = (id: string) => {
    setExercicios(prev => prev.filter(e => e.id !== id))
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= exercicios.length) return

    const newExercicios = [...exercicios]
    const [removed] = newExercicios.splice(index, 1)
    newExercicios.splice(newIndex, 0, removed)
    setExercicios(newExercicios)
  }

  const handleSubmit = async () => {
    if (!nome.trim()) {
      alert('Digite o nome do treino')
      return
    }

    setLoading(true)
    try {
      const templateExercises: Omit<TemplateExercise, 'id'>[] = exercicios.map((e, index) => ({
        exercise_id: crypto.randomUUID(), // Temporary ID
        nome: e.nome,
        ordem: index,
        series: e.series,
        repeticoes: e.repeticoes,
        descanso: e.descanso,
        carga_sugerida: e.carga_sugerida,
        notas: e.notas
      }))

      await createTemplate({
        nome,
        tipo,
        fase,
        dia_semana: diaSemana,
        duracao_estimada: duracaoEstimada,
        exercicios: templateExercises as TemplateExercise[]
      })

      router.push('/treino/templates')
    } catch (error) {
      console.error('Erro ao criar template:', error)
      alert('Erro ao criar treino. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Novo Treino</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure seu template de treino
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
            className="bg-[#14141F] border-[#2E2E3E]"
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
                    ? 'bg-violet-500/20 border-violet-500/50'
                    : 'bg-[#14141F] border-[#2E2E3E] hover:border-violet-500/30'
                )}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="font-medium text-white mt-2">{t.label}</p>
                <p className="text-xs text-slate-400 mt-1">{t.description}</p>
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
              className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-lg px-4 py-3 text-white appearance-none cursor-pointer"
            >
              {diasSemana.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
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
                className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-lg px-4 py-3 text-white appearance-none cursor-pointer"
              >
                {fases.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
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
                className="bg-[#14141F] border-[#2E2E3E] pr-12"
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                  className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
                      >
                        <GripVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-white">{ex.nome}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
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
                        <p className="text-xs text-slate-500 mt-1">{ex.notas}</p>
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
              className="bg-[#14141F] border border-violet-500/30 rounded-xl p-4 space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome do exercício</Label>
                <Input
                  value={novoExercicio.nome}
                  onChange={(e) => setNovoExercicio(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Supino Reto"
                  className="bg-[#0A0A0F] border-[#2E2E3E]"
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
                    className="bg-[#0A0A0F] border-[#2E2E3E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Repetições</Label>
                  <Input
                    value={novoExercicio.repeticoes}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, repeticoes: e.target.value }))}
                    placeholder="12"
                    className="bg-[#0A0A0F] border-[#2E2E3E]"
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
                    className="bg-[#0A0A0F] border-[#2E2E3E]"
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
                    className="bg-[#0A0A0F] border-[#2E2E3E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input
                    value={novoExercicio.notas || ''}
                    onChange={(e) => setNovoExercicio(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Opcional"
                    className="bg-[#0A0A0F] border-[#2E2E3E]"
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
            disabled={loading || !nome.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Treino'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

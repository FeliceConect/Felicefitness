'use client'

import { useState, useEffect, useCallback } from 'react'
import { Library, Plus, Search, Play, Pencil, Trash2 } from 'lucide-react'
import { ExerciseFormModal, type ExerciseData } from '@/components/portal/exercises/exercise-form-modal'
import { getYouTubeThumbnail } from '@/lib/utils/youtube'

interface Exercise {
  id: string
  nome: string
  grupo_muscular: string
  equipamento?: string
  dificuldade?: string
  video_url?: string
  video_thumbnail?: string
  instrucoes?: string
  is_composto?: boolean
}

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Biceps', 'Triceps',
  'Pernas', 'Gluteos', 'Abdomen', 'Panturrilha', 'Core', 'Full Body',
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [saving, setSaving] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterGroup) params.set('muscleGroup', filterGroup)
      params.set('limit', '50')
      const res = await fetch(`/api/portal/exercises?${params}`)
      const data = await res.json()
      if (data.success) {
        setExercises(data.exercises || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Erro ao buscar exercicios:', error)
    } finally {
      setLoading(false)
    }
  }, [search, filterGroup])

  useEffect(() => {
    const timeout = setTimeout(fetchExercises, 300)
    return () => clearTimeout(timeout)
  }, [fetchExercises])

  const handleSave = async (data: ExerciseData) => {
    setSaving(true)
    try {
      if (editingExercise) {
        const res = await fetch(`/api/portal/exercises/${editingExercise.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          setEditingExercise(null)
          fetchExercises()
        }
      } else {
        const res = await fetch('/api/portal/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          fetchExercises()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar exercicio:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este exercicio?')) return
    try {
      const res = await fetch(`/api/portal/exercises/${id}`, { method: 'DELETE' })
      if ((await res.json()).success) {
        fetchExercises()
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="w-6 h-6 text-dourado" />
            Biblioteca de Exercicios
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            {total} exercicios cadastrados
          </p>
        </div>
        <button
          onClick={() => { setEditingExercise(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-white rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            placeholder="Buscar exercicio..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterGroup('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !filterGroup ? 'bg-dourado text-white' : 'bg-background-elevated text-foreground-secondary'
            }`}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterGroup === g ? 'bg-dourado text-white' : 'bg-background-elevated text-foreground-secondary'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <Library className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Nenhum exercicio encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => {
            const thumb = exercise.video_thumbnail || (exercise.video_url ? getYouTubeThumbnail(exercise.video_url) : null)
            return (
              <div
                key={exercise.id}
                className="bg-white border border-border rounded-xl overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-background-elevated relative">
                  {thumb ? (
                    <img src={thumb} alt={exercise.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Library className="w-8 h-8 text-foreground-muted" />
                    </div>
                  )}
                  {exercise.video_url && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-10 h-10 text-white" fill="white" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-foreground text-sm truncate">{exercise.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dourado/10 text-dourado font-medium">
                      {exercise.grupo_muscular}
                    </span>
                    {exercise.dificuldade && (
                      <span className="text-xs text-foreground-muted">{exercise.dificuldade}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-foreground-secondary hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ExerciseFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingExercise(null) }}
        onSave={handleSave}
        initialData={editingExercise ? {
          nome: editingExercise.nome,
          grupo_muscular: editingExercise.grupo_muscular,
          equipamento: editingExercise.equipamento,
          dificuldade: editingExercise.dificuldade,
          video_url: editingExercise.video_url,
          instructions: editingExercise.instrucoes,
          is_composto: editingExercise.is_composto,
        } : null}
        saving={saving}
      />
    </div>
  )
}

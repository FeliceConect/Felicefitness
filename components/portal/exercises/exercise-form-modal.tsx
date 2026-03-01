'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface ExerciseData {
  nome: string
  nome_en?: string
  grupo_muscular: string
  equipamento?: string
  tipo?: string
  dificuldade?: string
  video_url?: string
  instructions?: string
  is_composto?: boolean
}

interface ExerciseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExerciseData) => Promise<void>
  initialData?: ExerciseData | null
  saving?: boolean
}

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Biceps', 'Triceps',
  'Pernas', 'Gluteos', 'Abdomen', 'Antebraco', 'Panturrilha', 'Core', 'Full Body',
]

const DIFFICULTIES = ['Iniciante', 'Intermediario', 'Avancado']

const EQUIPMENT = [
  'Barra', 'Haltere', 'Maquina', 'Cabo', 'Peso Corporal',
  'Kettlebell', 'Elástico', 'Bola', 'TRX', 'Outro',
]

export function ExerciseFormModal({ isOpen, onClose, onSave, initialData, saving }: ExerciseFormModalProps) {
  const [form, setForm] = useState<ExerciseData>({
    nome: '',
    grupo_muscular: '',
    ...initialData,
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        nome: '',
        grupo_muscular: '',
        ...initialData,
      })
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim() || !form.grupo_muscular) return
    await onSave(form)
  }

  const updateField = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {initialData ? 'Editar Exercicio' : 'Novo Exercicio'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              placeholder="Ex: Supino Reto"
            />
          </div>

          {/* Grupo Muscular */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Grupo Muscular *</label>
            <select
              value={form.grupo_muscular}
              onChange={(e) => updateField('grupo_muscular', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            >
              <option value="">Selecione</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Dificuldade */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Dificuldade</label>
              <select
                value={form.dificuldade || ''}
                onChange={(e) => updateField('dificuldade', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              >
                <option value="">Selecione</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Equipamento */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Equipamento</label>
              <select
                value={form.equipamento || ''}
                onChange={(e) => updateField('equipamento', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              >
                <option value="">Selecione</option>
                {EQUIPMENT.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Video YouTube (URL)</label>
            <input
              type="text"
              value={form.video_url || ''}
              onChange={(e) => updateField('video_url', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Instrucoes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Instrucoes</label>
            <textarea
              value={form.instructions || ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
              placeholder="Descreva como executar o exercicio..."
            />
          </div>

          {/* Composto */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_composto || false}
              onChange={(e) => updateField('is_composto', e.target.checked)}
              className="rounded border-border text-dourado focus:ring-dourado"
            />
            <span className="text-sm text-foreground">Exercicio composto (multiarticular)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.nome.trim() || !form.grupo_muscular || saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

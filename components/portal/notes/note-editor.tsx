'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { note_type: string; content: string }) => void
  initialData?: { note_type: string; content: string } | null
  saving?: boolean
}

const NOTE_TYPES = [
  { value: 'observation', label: 'Observacao' },
  { value: 'evolution', label: 'Evolucao' },
  { value: 'action_plan', label: 'Plano de Acao' },
  { value: 'alert', label: 'Alerta' },
]

export function NoteEditor({ isOpen, onClose, onSave, initialData, saving }: NoteEditorProps) {
  const [noteType, setNoteType] = useState(initialData?.note_type || 'observation')
  const [content, setContent] = useState(initialData?.content || '')

  useEffect(() => {
    if (isOpen) {
      setNoteType(initialData?.note_type || 'observation')
      setContent(initialData?.content || '')
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({ note_type: noteType, content: content.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {initialData ? 'Editar Nota' : 'Nova Nota'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {NOTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNoteType(type.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    noteType === type.value
                      ? 'bg-dourado/10 border-dourado text-dourado'
                      : 'bg-background-elevated border-border text-foreground-secondary hover:border-foreground-muted'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Conteudo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
              placeholder="Escreva a nota do paciente..."
            />
          </div>
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
              disabled={!content.trim() || saving}
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

'use client'

import { FileText, AlertTriangle, TrendingUp, ClipboardList, Calendar, Pencil, Trash2 } from 'lucide-react'

export interface Note {
  id: string
  note_type: string
  content: string
  created_at: string
  appointment_id?: string | null
  patient_id?: string
}

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

const NOTE_TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  observation: { label: 'Observacao', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  evolution: { label: 'Evolucao', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  action_plan: { label: 'Plano de Acao', icon: ClipboardList, color: 'text-dourado', bg: 'bg-amber-50 border-amber-200' },
  alert: { label: 'Alerta', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const config = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.observation
  const Icon = config.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          {note.appointment_id && (
            <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
              <Calendar className="w-3 h-3" />
              Consulta
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors text-foreground-secondary"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-foreground-secondary hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
      <p className="text-foreground-muted text-xs mt-3">{formatDate(note.created_at)}</p>
    </div>
  )
}

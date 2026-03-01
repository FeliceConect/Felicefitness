'use client'

import { useState } from 'react'
import { Stethoscope, Brain, Dumbbell, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import type { Note } from '@/components/portal/notes/note-card'
import { getSectionsForType, getConsultationLabel } from './consultation-sections'

interface ConsultationData {
  anamnese: string
  exames: string
  diagnostico: string
  conduta: string
}

interface ConsultationCardProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
  professionalType?: string
}

export function ConsultationCard({ note, onEdit, onDelete, professionalType }: ConsultationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const sections = getSectionsForType(professionalType)
  const label = getConsultationLabel(professionalType)

  let data: ConsultationData
  try {
    data = JSON.parse(note.content)
  } catch {
    data = { anamnese: note.content, exames: '', diagnostico: '', conduta: '' }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filledSections = sections.filter(s => data[s.key]?.trim())

  const Icon = professionalType === 'coach' ? Brain
    : professionalType === 'trainer' ? Dumbbell
    : Stethoscope

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-elevated/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-vinho/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-vinho" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-foreground-muted">{formatDate(note.created_at)}</p>
          </div>
          <span className="text-xs text-foreground-muted bg-background-elevated px-2 py-0.5 rounded-full">
            {filledSections.length} seções
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors text-foreground-secondary"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Remover ${label.toLowerCase()}?`)) onDelete()
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-foreground-secondary hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-foreground-muted ml-1" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground-muted ml-1" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {sections.map((section) => {
            const content = data[section.key]
            if (!content?.trim()) return null
            return (
              <div key={section.key}>
                <h4 className="text-sm font-medium text-foreground-secondary mb-1">{section.label}</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
              </div>
            )
          })}
          {filledSections.length === 0 && (
            <p className="text-sm text-foreground-muted">Nenhum conteúdo preenchido</p>
          )}
        </div>
      )}
    </div>
  )
}

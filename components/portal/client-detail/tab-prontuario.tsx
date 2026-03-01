'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
import type { Note } from '@/components/portal/notes/note-card'
import { ConsultationEditor } from '@/components/portal/notes/consultation-editor'
import { ConsultationCard } from '@/components/portal/notes/consultation-card'
import { getConsultationLabel } from '@/components/portal/notes/consultation-sections'

interface ConsultationData {
  anamnese: string
  exames: string
  diagnostico: string
  conduta: string
}

interface TabProntuarioProps {
  patientId: string
  professionalType?: string
}

export function TabProntuario({ patientId, professionalType }: TabProntuarioProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showConsultationEditor, setShowConsultationEditor] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<{ id?: string; data?: ConsultationData } | null>(null)
  const [saving, setSaving] = useState(false)

  const label = getConsultationLabel(professionalType)

  const fetchNotes = async () => {
    try {
      const r = await fetch(`/api/portal/notes?patientId=${patientId}`)
      const data = await r.json()
      if (data.success) setNotes(data.notes || [])
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [patientId])

  const consultations = notes.filter(n => n.note_type === 'consultation')

  const handleSaveConsultation = async (data: ConsultationData) => {
    setSaving(true)
    try {
      const content = JSON.stringify(data)
      if (editingConsultation?.id) {
        const res = await fetch(`/api/portal/notes/${editingConsultation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note_type: 'consultation', content }),
        })
        if ((await res.json()).success) {
          setShowConsultationEditor(false)
          setEditingConsultation(null)
          await fetchNotes()
        }
      } else {
        const res = await fetch('/api/portal/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId, note_type: 'consultation', content }),
        })
        if ((await res.json()).success) {
          setShowConsultationEditor(false)
          await fetchNotes()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar consulta:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm(`Remover ${label.toLowerCase()}?`)) return
    try {
      await fetch(`/api/portal/notes/${id}`, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleEditConsultation = (note: Note) => {
    try {
      const data = JSON.parse(note.content) as ConsultationData
      setEditingConsultation({ id: note.id, data })
      setShowConsultationEditor(true)
    } catch {
      setEditingConsultation({ id: note.id, data: { anamnese: note.content, exames: '', diagnostico: '', conduta: '' } })
      setShowConsultationEditor(true)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingConsultation(null); setShowConsultationEditor(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova {label}
        </button>
      </div>

      {/* Consultas */}
      {consultations.length === 0 ? (
        <div className="text-center py-8 bg-white border border-border rounded-xl">
          <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary">Nenhuma {label.toLowerCase()} registrada</p>
          <p className="text-foreground-muted text-sm mt-1">
            {professionalType === 'coach'
              ? 'Registre sessões com anamnese, avaliação comportamental, objetivos e plano de ação'
              : 'Registre consultas com anamnese, exames, diagnóstico e conduta'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((note) => (
            <ConsultationCard
              key={note.id}
              note={note}
              onEdit={() => handleEditConsultation(note)}
              onDelete={() => handleDeleteNote(note.id)}
              professionalType={professionalType}
            />
          ))}
        </div>
      )}

      {/* Consultation Editor Modal */}
      <ConsultationEditor
        isOpen={showConsultationEditor}
        onClose={() => { setShowConsultationEditor(false); setEditingConsultation(null) }}
        onSave={handleSaveConsultation}
        initialData={editingConsultation?.data}
        saving={saving}
        professionalType={professionalType}
      />
    </div>
  )
}

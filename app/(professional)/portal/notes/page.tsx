'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, User } from 'lucide-react'
import type { Note } from '@/components/portal/notes/note-card'
import { ConsultationEditor } from '@/components/portal/notes/consultation-editor'
import { ConsultationCard } from '@/components/portal/notes/consultation-card'
import { getConsultationLabel } from '@/components/portal/notes/consultation-sections'
import { useProfessional } from '@/hooks/use-professional'

interface Client {
  id: string
  nome: string
  email: string
}

interface ConsultationData {
  anamnese: string
  exames: string
  diagnostico: string
  conduta: string
}

export default function ProntuarioPage() {
  const { professional } = useProfessional()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<{ id?: string; data?: ConsultationData } | null>(null)
  const [saving, setSaving] = useState(false)

  const professionalType = professional?.type
  const label = getConsultationLabel(professionalType)

  // Fetch assigned clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/professional/clients')
        const data = await res.json()
        if (data.success) {
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  // Fetch notes when client changes
  const fetchNotes = useCallback(async () => {
    if (!selectedClient) {
      setNotes([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/notes?patientId=${selectedClient}`)
      const data = await res.json()
      if (data.success) {
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedClient])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Filter consultations only
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
          setShowEditor(false)
          setEditingConsultation(null)
          await fetchNotes()
        }
      } else {
        const res = await fetch('/api/portal/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: selectedClient, note_type: 'consultation', content }),
        })
        if ((await res.json()).success) {
          setShowEditor(false)
          setEditingConsultation(null)
          await fetchNotes()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/portal/notes/${id}`, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Erro ao deletar:', error)
    }
  }

  const handleEditConsultation = (note: Note) => {
    try {
      const data = JSON.parse(note.content) as ConsultationData
      setEditingConsultation({ id: note.id, data })
      setShowEditor(true)
    } catch {
      setEditingConsultation({ id: note.id, data: { anamnese: note.content, exames: '', diagnostico: '', conduta: '' } })
      setShowEditor(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-dourado" />
            Prontuário
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            Registros e acompanhamento dos seus pacientes
          </p>
        </div>
        {selectedClient && (
          <button
            onClick={() => { setEditingConsultation(null); setShowEditor(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-white rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova {label}
          </button>
        )}
      </div>

      {/* Client selector */}
      <div className="bg-white border border-border rounded-xl p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <User className="w-4 h-4 text-foreground-secondary" />
          Paciente
        </label>
        {loadingClients ? (
          <div className="h-10 bg-background-elevated animate-pulse rounded-lg" />
        ) : (
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
          >
            <option value="">Selecione um paciente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nome || c.email}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {!selectedClient ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Selecione um paciente para ver o prontuário</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <div className="text-center py-12 bg-white border border-border rounded-xl">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Nenhuma {label.toLowerCase()} registrada</p>
          <button
            onClick={() => { setEditingConsultation(null); setShowEditor(true) }}
            className="mt-3 text-dourado text-sm font-medium hover:text-dourado/80"
          >
            Registrar primeira {label.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((note) => (
            <ConsultationCard
              key={note.id}
              note={note}
              onEdit={() => handleEditConsultation(note)}
              onDelete={() => handleDelete(note.id)}
              professionalType={professionalType}
            />
          ))}
        </div>
      )}

      {/* Consultation Editor Modal */}
      <ConsultationEditor
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingConsultation(null) }}
        onSave={handleSaveConsultation}
        initialData={editingConsultation?.data}
        saving={saving}
        professionalType={professionalType}
      />
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Filter, User } from 'lucide-react'
import { NoteCard, type Note } from '@/components/portal/notes/note-card'
import { NoteEditor } from '@/components/portal/notes/note-editor'

interface Client {
  id: string
  nome: string
  email: string
}

export default function NotesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<string>('')

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

  // Fetch notes when client or filter changes
  const fetchNotes = useCallback(async () => {
    if (!selectedClient) {
      setNotes([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ patientId: selectedClient })
      if (filterType) params.set('noteType', filterType)
      const res = await fetch(`/api/portal/notes?${params}`)
      const data = await res.json()
      if (data.success) {
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedClient, filterType])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleSave = async (data: { note_type: string; content: string }) => {
    setSaving(true)
    try {
      if (editingNote) {
        const res = await fetch(`/api/portal/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (result.success) {
          setShowEditor(false)
          setEditingNote(null)
          fetchNotes()
        }
      } else {
        const res = await fetch('/api/portal/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: selectedClient,
            ...data,
          }),
        })
        const result = await res.json()
        if (result.success) {
          setShowEditor(false)
          fetchNotes()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar nota:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta nota?')) return
    try {
      const res = await fetch(`/api/portal/notes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchNotes()
      }
    } catch (error) {
      console.error('Erro ao deletar nota:', error)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setShowEditor(true)
  }

  const filterTypes = [
    { value: '', label: 'Todos' },
    { value: 'observation', label: 'Observacao' },
    { value: 'evolution', label: 'Evolucao' },
    { value: 'action_plan', label: 'Plano de Acao' },
    { value: 'alert', label: 'Alerta' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-dourado" />
            Prontuario
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            Notas e acompanhamento dos seus pacientes
          </p>
        </div>
        {selectedClient && (
          <button
            onClick={() => { setEditingNote(null); setShowEditor(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-white rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Nota
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

      {/* Filters */}
      {selectedClient && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          {filterTypes.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setFilterType(ft.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === ft.value
                  ? 'bg-dourado text-white'
                  : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      {!selectedClient ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Selecione um paciente para ver o prontuario</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Nenhuma nota encontrada</p>
          <button
            onClick={() => { setEditingNote(null); setShowEditor(true) }}
            className="mt-3 text-dourado text-sm font-medium hover:text-dourado/80"
          >
            Criar primeira nota
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      <NoteEditor
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingNote(null) }}
        onSave={handleSave}
        initialData={editingNote ? { note_type: editingNote.note_type, content: editingNote.content } : null}
        saving={saving}
      />
    </div>
  )
}

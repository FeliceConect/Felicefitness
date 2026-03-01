"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  User
} from 'lucide-react'

interface EnrichedNote {
  id: string
  professional_id: string
  patient_id: string
  appointment_id: string | null
  note_type: 'observation' | 'evolution' | 'action_plan' | 'alert'
  content: string
  visible_to_roles: string[]
  created_at: string
  patient: {
    id: string
    nome: string
    email: string
  }
  professional: {
    id: string
    display_name: string | null
    type: 'nutritionist' | 'trainer' | 'coach' | 'physiotherapist'
    user_id: string
  } | null
}

const NOTE_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  observation: {
    label: 'Observacao',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  evolution: {
    label: 'Evolucao',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  action_plan: {
    label: 'Plano de Acao',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  alert: {
    label: 'Alerta',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
}

const PROF_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  nutritionist: {
    label: 'Nutricionista',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  trainer: {
    label: 'Personal',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  coach: {
    label: 'Coach',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
  physiotherapist: {
    label: 'Fisioterapeuta',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
  },
}

export default function ProntuarioPage() {
  const [notes, setNotes] = useState<EnrichedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [noteTypeFilter, setNoteTypeFilter] = useState('')
  const [profTypeFilter, setProfTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (noteTypeFilter) params.append('noteType', noteTypeFilter)

      const response = await fetch(`/api/admin/notes?${params}`)
      const data = await response.json()

      if (data.success) {
        setNotes(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }, [noteTypeFilter])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const toggleExpand = (noteId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  // Client-side filtering for professional type and search query
  const filteredNotes = notes.filter(note => {
    if (profTypeFilter && note.professional?.type !== profTypeFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const patientName = note.patient?.nome?.toLowerCase() || ''
      const profName = note.professional?.display_name?.toLowerCase() || ''
      const content = note.content?.toLowerCase() || ''
      if (!patientName.includes(query) && !profName.includes(query) && !content.includes(query)) {
        return false
      }
    }
    return true
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Prontuario</h1>
        <p className="text-slate-400">Notas dos profissionais sobre pacientes</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400 hidden sm:block flex-shrink-0" />

          {/* Note Type Filter */}
          <select
            value={noteTypeFilter}
            onChange={(e) => setNoteTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos os tipos</option>
            <option value="observation">Observacao</option>
            <option value="evolution">Evolucao</option>
            <option value="action_plan">Plano de Acao</option>
            <option value="alert">Alerta</option>
          </select>

          {/* Professional Type Filter */}
          <select
            value={profTypeFilter}
            onChange={(e) => setProfTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos os profissionais</option>
            <option value="nutritionist">Nutricionista</option>
            <option value="trainer">Personal</option>
            <option value="coach">Coach</option>
            <option value="physiotherapist">Fisioterapeuta</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente, profissional ou conteudo..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        {loading ? (
          /* Loading Skeleton */
          <div className="divide-y divide-slate-700">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-20 rounded bg-slate-700" />
                      <div className="h-5 w-24 rounded bg-slate-700" />
                    </div>
                    <div className="h-4 w-48 rounded bg-slate-700" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-slate-700" />
                      <div className="h-3 w-3/4 rounded bg-slate-700" />
                    </div>
                    <div className="h-3 w-32 rounded bg-slate-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhuma nota encontrada</p>
            <p className="text-sm mt-1">
              {searchQuery || noteTypeFilter || profTypeFilter
                ? 'Tente ajustar os filtros de busca'
                : 'As notas dos profissionais aparecerão aqui'}
            </p>
          </div>
        ) : (
          /* Notes */
          <div className="divide-y divide-slate-700">
            {filteredNotes.map((note) => {
              const noteConfig = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.observation
              const profConfig = note.professional
                ? PROF_TYPE_CONFIG[note.professional.type] || PROF_TYPE_CONFIG.trainer
                : null
              const isExpanded = expandedNotes.has(note.id)
              const isLong = note.content.length > 200

              return (
                <div
                  key={note.id}
                  className="p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Patient Avatar */}
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-medium text-sm">
                        {(note.patient?.nome || 'P').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Note Type Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${noteConfig.bgColor} ${noteConfig.color} ${noteConfig.borderColor}`}>
                          {note.note_type === 'alert' && <AlertTriangle className="w-3 h-3" />}
                          {noteConfig.label}
                        </span>

                        {/* Professional Type Badge */}
                        {profConfig && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${profConfig.bgColor} ${profConfig.color} ${profConfig.borderColor}`}>
                            {profConfig.label}
                          </span>
                        )}
                      </div>

                      {/* Patient & Professional Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm text-white font-medium">
                            {note.patient?.nome || 'Paciente'}
                          </span>
                        </div>
                        {note.professional?.display_name && (
                          <span className="text-sm text-slate-400">
                            por {note.professional.display_name}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                        {isExpanded ? note.content : truncateContent(note.content)}
                      </div>

                      {/* Expand/Collapse */}
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(note.id)}
                          className="flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              Ver mais
                            </>
                          )}
                        </button>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          {formatDate(note.created_at)} as {formatTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && filteredNotes.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'nota encontrada' : 'notas encontradas'}
          {(searchQuery || noteTypeFilter || profTypeFilter) && notes.length !== filteredNotes.length && (
            <span> de {notes.length} total</span>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  Link2,
  Plus,
  Filter,
  Trash2,
  X,
  Search,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Assignment {
  id: string
  client_id: string
  professional_id: string
  assigned_at: string
  notes: string | null
  is_active: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  professional: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assigned_by_user: any
}

interface Professional {
  id: string
  type: 'nutritionist' | 'trainer' | 'coach' | 'physiotherapist'
  display_name: string | null
  avatar_url: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fitness_profiles: any
}

interface Client {
  id: string
  nome: string
  email: string
  role?: string
}

interface GroupedClient {
  client: { id: string; nome: string; email: string }
  assignments: Assignment[]
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [professionalFilter, setProfessionalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('true')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [searchClient, setSearchClient] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (professionalFilter) params.append('professionalId', professionalFilter)
      if (activeFilter) params.append('active', activeFilter)

      const response = await fetch(`/api/admin/assignments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Erro ao buscar atribuições:', error)
    } finally {
      setLoading(false)
    }
  }, [professionalFilter, activeFilter])

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/admin/professionals?active=true')
      const data = await response.json()

      if (data.success) {
        setProfessionals(data.professionals || [])
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
    }
  }

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const response = await fetch('/api/admin/users?role=assignable&limit=100')
      const data = await response.json()

      if (data.success) {
        setClients(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
    fetchProfessionals()
  }, [fetchAssignments])

  const handleCreateAssignment = async () => {
    if (!selectedClient || selectedProfessionals.length === 0) {
      alert('Selecione um cliente e pelo menos um profissional')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          professionalIds: selectedProfessionals,
          notes
        })
      })

      const data = await response.json()

      if (data.success) {
        const failed = data.results?.filter((r: { success: boolean }) => !r.success) || []
        if (failed.length > 0 && failed.length < selectedProfessionals.length) {
          alert(`${data.message}. Alguns já existiam.`)
        }
        fetchAssignments()
        setShowAddModal(false)
        resetForm()
      } else {
        alert(data.error || 'Erro ao criar atribuições')
      }
    } catch (error) {
      console.error('Erro ao criar atribuições:', error)
      alert('Erro ao criar atribuições')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (assignment: Assignment) => {
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          isActive: !assignment.is_active
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchAssignments()
      } else {
        alert(data.error || 'Erro ao atualizar atribuição')
      }
    } catch (error) {
      console.error('Erro ao atualizar atribuição:', error)
    }
  }

  const handleDeleteAssignment = async (assignment: Assignment) => {
    const profName = assignment.professional?.display_name || assignment.professional?.fitness_profiles?.nome || 'Profissional'

    if (!confirm(`Remover ${profName} deste cliente?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assignments?id=${assignment.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchAssignments()
      } else {
        alert(data.error || 'Erro ao remover atribuição')
      }
    } catch (error) {
      console.error('Erro ao remover atribuição:', error)
      alert('Erro ao remover atribuição')
    }
  }

  const resetForm = () => {
    setSelectedClient('')
    setSelectedProfessionals([])
    setNotes('')
    setSearchClient('')
  }

  const openAddModal = () => {
    resetForm()
    fetchClients()
    setShowAddModal(true)
  }

  const toggleProfessionalSelection = (profId: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(profId)
        ? prev.filter(id => id !== profId)
        : [...prev, profId]
    )
  }

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'nutritionist': return 'Nutricionista'
      case 'trainer': return 'Personal'
      case 'coach': return 'Coach'
      case 'physiotherapist': return 'Fisioterapeuta'
      default: return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'nutritionist': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'trainer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'coach': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'physiotherapist': return 'bg-teal-500/20 text-teal-400 border-teal-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'nutritionist': return '🥗'
      case 'trainer': return '💪'
      case 'coach': return '🧠'
      case 'physiotherapist': return '🦴'
      default: return '👤'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredClients = clients.filter(client =>
    client.nome?.toLowerCase().includes(searchClient.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchClient.toLowerCase())
  )

  // Agrupar atribuições por cliente
  const groupedByClient: GroupedClient[] = (() => {
    const map = new Map<string, GroupedClient>()
    assignments.forEach(a => {
      const clientId = a.client_id
      if (!map.has(clientId)) {
        map.set(clientId, {
          client: a.client || { id: clientId, nome: 'Cliente', email: '' },
          assignments: []
        })
      }
      map.get(clientId)!.assignments.push(a)
    })
    // Ordenar por nome do cliente
    return Array.from(map.values()).sort((a, b) =>
      (a.client.nome || '').localeCompare(b.client.nome || '')
    )
  })()

  // Profissionais já atribuídos ao cliente selecionado
  const alreadyAssignedProfIds = selectedClient
    ? assignments
        .filter(a => a.client_id === selectedClient && a.is_active)
        .map(a => a.professional_id)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Atribuições</h1>
          <p className="text-slate-400">Vincular clientes a profissionais</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Atribuição
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />

          <select
            value={professionalFilter}
            onChange={(e) => setProfessionalFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos os profissionais</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.display_name || prof.fitness_profiles?.nome || 'Sem nome'} ({getTypeLabel(prof.type)})
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
        </div>
      </div>

      {/* Assignments Grouped by Client */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : groupedByClient.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 text-center py-12 text-slate-400">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma atribuição encontrada</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-violet-400 hover:text-violet-300"
            >
              Criar primeira atribuição
            </button>
          </div>
        ) : (
          groupedByClient.map((group) => {
            const isExpanded = expandedClients.has(group.client.id)
            const activeAssignments = group.assignments.filter(a => a.is_active)
            const inactiveAssignments = group.assignments.filter(a => !a.is_active)

            return (
              <div key={group.client.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Client Header */}
                <button
                  onClick={() => toggleClientExpanded(group.client.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-medium">
                        {(group.client.nome || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{group.client.nome || 'Sem nome'}</p>
                      <p className="text-xs text-slate-400">{group.client.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Professional badges preview */}
                    <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                      {activeAssignments.map(a => (
                        <span
                          key={a.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getTypeBadgeColor(a.professional?.type)}`}
                        >
                          {getTypeEmoji(a.professional?.type)}
                          {a.professional?.display_name || a.professional?.fitness_profiles?.nome || getTypeLabel(a.professional?.type)}
                        </span>
                      ))}
                      {inactiveAssignments.length > 0 && (
                        <span className="text-xs text-slate-500">
                          +{inactiveAssignments.length} inativo{inactiveAssignments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <span className="text-sm text-slate-500 tabular-nums">
                      {group.assignments.length} prof.
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-700 divide-y divide-slate-700/50">
                    {group.assignments.map(assignment => {
                      const profName = assignment.professional?.display_name || assignment.professional?.fitness_profiles?.nome || 'Profissional'
                      const profAvatar = assignment.professional?.avatar_url || assignment.professional?.fitness_profiles?.avatar_url
                      const profType = assignment.professional?.type

                      return (
                        <div key={assignment.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/20">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                              getTypeBadgeColor(profType).split(' ')[0]
                            }`}>
                              {profAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profAvatar} alt={profName} className="w-9 h-9 object-cover" />
                              ) : (
                                <span className={`text-sm font-medium ${getTypeBadgeColor(profType).split(' ')[1]}`}>
                                  {profName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{profName}</p>
                              <span className={`inline-flex items-center gap-1 text-xs ${getTypeBadgeColor(profType).split(' ')[1]}`}>
                                {getTypeEmoji(profType)} {getTypeLabel(profType)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 hidden sm:inline">
                              {formatDate(assignment.assigned_at)}
                            </span>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(assignment) }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                                assignment.is_active
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                              }`}
                            >
                              {assignment.is_active ? (
                                <><ToggleRight className="w-3.5 h-3.5" /> Ativo</>
                              ) : (
                                <><ToggleLeft className="w-3.5 h-3.5" /> Inativo</>
                              )}
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment) }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <h3 className="text-lg font-semibold text-white">Nova Atribuição</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Selecionar Cliente */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cliente / Paciente</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg">
                  {loadingClients ? (
                    <div className="p-4 text-center text-slate-400">Carregando...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Nenhum usuário encontrado</div>
                  ) : (
                    filteredClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client.id)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors ${
                          selectedClient === client.id ? 'bg-violet-500/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm text-violet-400">
                          {client.nome?.charAt(0).toUpperCase() || client.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm">{client.nome || 'Sem nome'}</p>
                            {client.role === 'super_admin' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dourado/20 text-dourado">Admin</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{client.email}</p>
                        </div>
                        {selectedClient === client.id && (
                          <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Selecionar Profissionais (multi-select) */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Profissionais
                  {selectedProfessionals.length > 0 && (
                    <span className="ml-2 text-violet-400">({selectedProfessionals.length} selecionado{selectedProfessionals.length > 1 ? 's' : ''})</span>
                  )}
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {professionals.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 border border-slate-600 rounded-lg">
                      Nenhum profissional ativo
                    </div>
                  ) : (
                    professionals.map(prof => {
                      const profName = prof.display_name || prof.fitness_profiles?.nome || 'Sem nome'
                      const isSelected = selectedProfessionals.includes(prof.id)
                      const alreadyAssigned = alreadyAssignedProfIds.includes(prof.id)

                      return (
                        <button
                          key={prof.id}
                          onClick={() => !alreadyAssigned && toggleProfessionalSelection(prof.id)}
                          disabled={alreadyAssigned}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            alreadyAssigned
                              ? 'border-slate-700 bg-slate-700/30 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'border-violet-500 bg-violet-500/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                            getTypeBadgeColor(prof.type).split(' ')[0]
                          }`}>
                            {prof.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={prof.avatar_url} alt={profName} className="w-10 h-10 object-cover" />
                            ) : (
                              <span className={`font-medium ${getTypeBadgeColor(prof.type).split(' ')[1]}`}>
                                {profName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-white font-medium">{profName}</p>
                            <span className={`inline-flex items-center gap-1 text-xs ${getTypeBadgeColor(prof.type).split(' ')[1]}`}>
                              {getTypeEmoji(prof.type)} {getTypeLabel(prof.type)}
                            </span>
                          </div>
                          {alreadyAssigned ? (
                            <span className="text-xs text-slate-500">Já atribuído</span>
                          ) : isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-600"></div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre esta atribuição..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={saving || !selectedClient || selectedProfessionals.length === 0}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : `Atribuir ${selectedProfessionals.length > 0 ? `(${selectedProfessionals.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

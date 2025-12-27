"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  Link2,
  Plus,
  Filter,
  Trash2,
  X,
  Search,
  ArrowRight,
  ToggleLeft,
  ToggleRight
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
  type: 'nutritionist' | 'trainer'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fitness_profiles: any
}

interface Client {
  id: string
  nome: string
  email: string
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

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProfessional, setSelectedProfessional] = useState('')
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
      const response = await fetch('/api/admin/users?role=client&limit=100')
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
    if (!selectedClient || !selectedProfessional) {
      alert('Selecione um cliente e um profissional')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          professionalId: selectedProfessional,
          notes
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchAssignments()
        setShowAddModal(false)
        resetForm()
      } else {
        alert(data.error || 'Erro ao criar atribuição')
      }
    } catch (error) {
      console.error('Erro ao criar atribuição:', error)
      alert('Erro ao criar atribuição')
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
    const clientName = assignment.client?.nome || 'Cliente'
    const profName = assignment.professional?.fitness_profiles?.nome || 'Profissional'

    if (!confirm(`Tem certeza que deseja remover a atribuição de ${clientName} com ${profName}?`)) {
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
    setSelectedProfessional('')
    setNotes('')
    setSearchClient('')
  }

  const openAddModal = () => {
    resetForm()
    fetchClients()
    setShowAddModal(true)
  }

  const getTypeLabel = (type: string) => {
    return type === 'nutritionist' ? 'Nutricionista' : 'Personal'
  }

  const getTypeBadgeColor = (type: string) => {
    return type === 'nutritionist'
      ? 'bg-green-500/20 text-green-400'
      : 'bg-blue-500/20 text-blue-400'
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

          {/* Professional Filter */}
          <select
            value={professionalFilter}
            onChange={(e) => setProfessionalFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos os profissionais</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.fitness_profiles?.nome || 'Sem nome'} ({getTypeLabel(prof.type)})
              </option>
            ))}
          </select>

          {/* Active Filter */}
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

      {/* Assignments List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
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
          <div className="divide-y divide-slate-700">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-slate-700/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Assignment Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Client */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 font-medium">
                          {assignment.client?.nome?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {assignment.client?.nome || 'Cliente'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {assignment.client?.email}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />

                    {/* Professional */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        assignment.professional?.type === 'nutritionist'
                          ? 'bg-green-500/20'
                          : 'bg-blue-500/20'
                      }`}>
                        <span className={`font-medium ${
                          assignment.professional?.type === 'nutritionist'
                            ? 'text-green-400'
                            : 'text-blue-400'
                        }`}>
                          {assignment.professional?.fitness_profiles?.nome?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {assignment.professional?.fitness_profiles?.nome || 'Profissional'}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getTypeBadgeColor(assignment.professional?.type)}`}>
                          {assignment.professional?.type === 'nutritionist' ? '🥗' : '💪'}
                          {getTypeLabel(assignment.professional?.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                      {formatDate(assignment.assigned_at)}
                    </div>

                    <button
                      onClick={() => handleToggleActive(assignment)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        assignment.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                      }`}
                    >
                      {assignment.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inativo
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {assignment.notes && (
                  <div className="mt-2 ml-14 text-sm text-slate-400 bg-slate-700/30 rounded-lg px-3 py-2">
                    {assignment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
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
                <label className="block text-sm text-slate-400 mb-2">Cliente</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg">
                  {loadingClients ? (
                    <div className="p-4 text-center text-slate-400">Carregando...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Nenhum cliente encontrado</div>
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
                          <p className="text-white text-sm">{client.nome || 'Sem nome'}</p>
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

              {/* Selecionar Profissional */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Profissional</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {professionals.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 border border-slate-600 rounded-lg">
                      Nenhum profissional ativo
                    </div>
                  ) : (
                    professionals.map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedProfessional(prof.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          selectedProfessional === prof.id
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          prof.type === 'nutritionist' ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          <span className={`font-medium ${
                            prof.type === 'nutritionist' ? 'text-green-400' : 'text-blue-400'
                          }`}>
                            {prof.fitness_profiles?.nome?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-medium">
                            {prof.fitness_profiles?.nome || 'Sem nome'}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-xs ${getTypeBadgeColor(prof.type)}`}>
                            {prof.type === 'nutritionist' ? '🥗 Nutricionista' : '💪 Personal'}
                          </span>
                        </div>
                        {selectedProfessional === prof.id && (
                          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </button>
                    ))
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
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={saving || !selectedClient || !selectedProfessional}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Criar Atribuição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

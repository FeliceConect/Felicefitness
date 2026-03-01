'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Calendar,
  TrendingUp,
  Zap,
  X,
  Search,
  Users,
  Filter,
  UserCheck,
  CheckSquare,
} from 'lucide-react'

interface Ranking {
  id: string
  name: string
  type: string
  category: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  description: string | null
  point_rules: Record<string, unknown>
  created_at: string
}

interface PointTransaction {
  id: string
  user_id: string
  points: number
  reason: string
  category: string
  source: string
  awarded_by: string | null
  created_at: string
  user_name?: string
}

interface Client {
  id: string
  nome: string
  email: string
}

interface Professional {
  id: string
  display_name: string
  type: string
}

type SelectionMode = 'all' | 'filter' | 'manual'

const RANKING_TYPES = [
  { value: 'general', label: 'Geral' },
  { value: 'semester', label: 'Semestral' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'challenge', label: 'Desafio' },
  { value: 'category', label: 'Categoria' },
]

const CATEGORIES = [
  { value: '', label: 'Nenhuma' },
  { value: 'nutrition', label: 'Nutricao' },
  { value: 'workout', label: 'Treino' },
  { value: 'consistency', label: 'Consistencia' },
]

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRanking, setEditingRanking] = useState<Ranking | null>(null)
  const [saving, setSaving] = useState(false)

  // Bio points modal
  const [showBioModal, setShowBioModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [bioPoints, setBioPoints] = useState(30)
  const [bioReason, setBioReason] = useState('')
  const [awardingBio, setAwardingBio] = useState(false)

  // Point transactions
  const [showTransactions, setShowTransactions] = useState(false)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [txSearch, setTxSearch] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'general',
    category: '',
    start_date: '',
    end_date: '',
    description: '',
    add_all_clients: true,
  })

  // Patient selection for new ranking
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all')
  const [allClients, setAllClients] = useState<Client[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set())
  const [clientSearch, setClientSearch] = useState('')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filterProfessionalId, setFilterProfessionalId] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loadingClients, setLoadingClients] = useState(false)

  const fetchRankings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rankings')
      const data = await res.json()
      if (data.success) {
        setRankings(data.rankings || [])
      }
    } catch (error) {
      console.error('Erro ao buscar rankings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRanking) {
        const res = await fetch(`/api/rankings/${editingRanking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          setEditingRanking(null)
          fetchRankings()
        }
      } else {
        // Build payload with patient selection
        const payload = {
          ...form,
          add_all_clients: selectionMode === 'all',
          selected_client_ids: selectionMode !== 'all' ? Array.from(selectedClientIds) : undefined,
        }
        const res = await fetch('/api/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          fetchRankings()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ranking:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (ranking: Ranking) => {
    try {
      await fetch(`/api/rankings/${ranking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !ranking.is_active }),
      })
      fetchRankings()
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const openEdit = (ranking: Ranking) => {
    setEditingRanking(ranking)
    setForm({
      name: ranking.name,
      type: ranking.type,
      category: ranking.category || '',
      start_date: ranking.start_date || '',
      end_date: ranking.end_date || '',
      description: ranking.description || '',
      add_all_clients: false,
    })
    setShowForm(true)
  }

  const loadClientsAndProfessionals = async () => {
    setLoadingClients(true)
    try {
      const [clientsRes, profsRes] = await Promise.all([
        fetch('/api/professional/clients?all=true').catch(() => null),
        fetch('/api/professional/list').catch(() => null),
      ])

      if (clientsRes) {
        const data = await clientsRes.json()
        if (data.success && data.data) {
          setAllClients(data.data.map((c: { client_id: string; client_name: string; client_email: string }) => ({
            id: c.client_id,
            nome: c.client_name,
            email: c.client_email,
          })))
        }
      }

      if (profsRes) {
        const data = await profsRes.json()
        if (data.success && data.data) {
          setProfessionals(data.data)
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingClients(false)
    }
  }

  const openNew = () => {
    setEditingRanking(null)
    setForm({
      name: '',
      type: 'general',
      category: '',
      start_date: '',
      end_date: '',
      description: '',
      add_all_clients: true,
    })
    setSelectionMode('all')
    setSelectedClientIds(new Set())
    setClientSearch('')
    setFilterProfessionalId('')
    setFilterStatus('all')
    setShowForm(true)
    loadClientsAndProfessionals()
  }

  // Bioimpedance points
  const openBioModal = async () => {
    setShowBioModal(true)
    try {
      const res = await fetch('/api/admin/users?role=client')
      const data = await res.json()
      if (data.success) {
        setClients(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const awardBioPoints = async () => {
    if (!selectedClient || !bioReason) return
    setAwardingBio(true)
    try {
      const res = await fetch('/api/admin/rankings/bio-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          points: bioPoints,
          reason: bioReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowBioModal(false)
        setSelectedClient('')
        setBioPoints(30)
        setBioReason('')
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setAwardingBio(false)
    }
  }

  // Transactions
  const fetchTransactions = async () => {
    setShowTransactions(true)
    setLoadingTransactions(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (txSearch) params.set('search', txSearch)
      const res = await fetch(`/api/admin/rankings/transactions?${params}`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const getTypeLabel = (type: string) => {
    return RANKING_TYPES.find(t => t.value === type)?.label || type
  }

  const getCategoryLabel = (category: string | null) => {
    if (!category) return ''
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-dourado" />
            Rankings & Gamificacao
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            Gerenciar rankings, pontuacao e bioimpedancia
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBioModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-vinho text-foreground rounded-lg text-sm font-medium hover:bg-vinho/80 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Bioimpedancia
          </button>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2.5 bg-background-elevated text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Transacoes
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-foreground rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Ranking
          </button>
        </div>
      </div>

      {/* Rankings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-border rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Trophy className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Nenhum ranking criado</p>
          <button onClick={openNew} className="mt-3 text-dourado text-sm font-medium hover:text-dourado/80">
            Criar primeiro ranking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map(ranking => (
            <div
              key={ranking.id}
              className={`bg-white border rounded-xl p-4 ${
                ranking.is_active ? 'border-dourado/30' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-foreground font-semibold">{ranking.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dourado/20 text-dourado font-medium">
                      {getTypeLabel(ranking.type)}
                    </span>
                    {ranking.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-vinho/20 text-vinho font-medium">
                        {getCategoryLabel(ranking.category)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(ranking)}
                    className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(ranking)}
                    className={`p-1.5 rounded-lg hover:bg-background-elevated ${
                      ranking.is_active ? 'text-green-400' : 'text-foreground-muted'
                    }`}
                  >
                    {ranking.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {ranking.description && (
                <p className="text-foreground-secondary text-sm mb-3 line-clamp-2">{ranking.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-foreground-muted">
                {ranking.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ranking.start_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {ranking.end_date && (
                  <span>
                    ate {new Date(ranking.end_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingRanking ? 'Editar Ranking' : 'Novo Ranking'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingRanking(null) }} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  placeholder="Ex: Ranking Geral 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {RANKING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Data Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Descricao</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Descricao do ranking..."
                />
              </div>

              {!editingRanking && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground-muted">Participantes</label>

                  {/* Selection Mode Tabs */}
                  <div className="flex gap-1 bg-background-elevated rounded-lg p-1">
                    {([
                      { mode: 'all' as SelectionMode, label: 'Todos', icon: Users },
                      { mode: 'filter' as SelectionMode, label: 'Filtros', icon: Filter },
                      { mode: 'manual' as SelectionMode, label: 'Manual', icon: UserCheck },
                    ]).map(({ mode, label, icon: Icon }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSelectionMode(mode)
                          if (mode === 'all') {
                            setSelectedClientIds(new Set())
                          }
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          selectionMode === mode
                            ? 'bg-dourado text-foreground'
                            : 'text-foreground-secondary hover:text-foreground hover:bg-border'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* All Mode */}
                  {selectionMode === 'all' && (
                    <div className="bg-background-elevated rounded-lg p-3 text-center">
                      <Users className="w-8 h-8 text-dourado mx-auto mb-1" />
                      <p className="text-sm text-foreground-muted">Todos os pacientes serao adicionados automaticamente</p>
                      <p className="text-xs text-foreground-muted mt-1">{allClients.length} pacientes cadastrados</p>
                    </div>
                  )}

                  {/* Filter Mode */}
                  {selectionMode === 'filter' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-foreground-secondary mb-1">Profissional</label>
                          <select
                            value={filterProfessionalId}
                            onChange={e => setFilterProfessionalId(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background-elevated text-foreground text-xs"
                          >
                            <option value="">Todos</option>
                            {professionals.map(p => (
                              <option key={p.id} value={p.id}>{p.display_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-foreground-secondary mb-1">Status</label>
                          <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background-elevated text-foreground text-xs"
                          >
                            <option value="all">Todos</option>
                            <option value="active">Ativos (ultimos 7 dias)</option>
                            <option value="inactive">Inativos</option>
                          </select>
                        </div>
                      </div>

                      {/* Filtered client list with checkboxes */}
                      <div className="bg-background-elevated rounded-lg max-h-40 overflow-y-auto">
                        {loadingClients ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Carregando...</div>
                        ) : allClients.length === 0 ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Nenhum paciente encontrado</div>
                        ) : (
                          <div className="divide-y divide-border">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedClientIds.size === allClients.length) {
                                  setSelectedClientIds(new Set())
                                } else {
                                  setSelectedClientIds(new Set(allClients.map(c => c.id)))
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dourado hover:bg-background-elevated font-medium"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {selectedClientIds.size === allClients.length ? 'Desmarcar todos' : 'Selecionar todos filtrados'}
                            </button>
                            {allClients.map(c => (
                              <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-background-elevated cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedClientIds.has(c.id)}
                                  onChange={e => {
                                    const next = new Set(selectedClientIds)
                                    if (e.target.checked) next.add(c.id)
                                    else next.delete(c.id)
                                    setSelectedClientIds(next)
                                  }}
                                  className="rounded border-border text-dourado focus:ring-dourado w-3.5 h-3.5"
                                />
                                <span className="text-sm text-foreground truncate">{c.nome || 'Sem nome'}</span>
                                <span className="text-xs text-foreground-muted truncate ml-auto">{c.email}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted text-right">
                        {selectedClientIds.size} de {allClients.length} selecionados
                      </p>
                    </div>
                  )}

                  {/* Manual Mode */}
                  {selectionMode === 'manual' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={e => setClientSearch(e.target.value)}
                          placeholder="Buscar paciente por nome ou email..."
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                        />
                      </div>

                      <div className="bg-background-elevated rounded-lg max-h-48 overflow-y-auto">
                        {loadingClients ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Carregando...</div>
                        ) : (
                          <div className="divide-y divide-border">
                            {allClients
                              .filter(c =>
                                !clientSearch ||
                                c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                              )
                              .map(c => (
                                <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-background-elevated cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedClientIds.has(c.id)}
                                    onChange={e => {
                                      const next = new Set(selectedClientIds)
                                      if (e.target.checked) next.add(c.id)
                                      else next.delete(c.id)
                                      setSelectedClientIds(next)
                                    }}
                                    className="rounded border-border text-dourado focus:ring-dourado w-3.5 h-3.5"
                                  />
                                  <span className="text-sm text-foreground truncate">{c.nome || 'Sem nome'}</span>
                                  <span className="text-xs text-foreground-muted truncate ml-auto">{c.email}</span>
                                </label>
                              ))
                            }
                            {allClients.filter(c =>
                              !clientSearch ||
                              c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="p-3 text-center text-sm text-foreground-muted">
                                {clientSearch ? 'Nenhum resultado para a busca' : 'Nenhum paciente cadastrado'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted text-right">
                        {selectedClientIds.size} paciente{selectedClientIds.size !== 1 ? 's' : ''} selecionado{selectedClientIds.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingRanking(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm font-medium hover:bg-background-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-foreground text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bioimpedance Points Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-dourado" />
                Pontos Bioimpedancia
              </h3>
              <button onClick={() => setShowBioModal(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Paciente *</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                >
                  <option value="">Selecione</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome || c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Pontos: {bioPoints}
                </label>
                <input
                  type="range"
                  min={20}
                  max={50}
                  step={5}
                  value={bioPoints}
                  onChange={e => setBioPoints(parseInt(e.target.value))}
                  className="w-full accent-dourado"
                />
                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>20</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Justificativa *</label>
                <textarea
                  value={bioReason}
                  onChange={e => setBioReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Ex: Reducao de 2% gordura corporal"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={awardBioPoints}
                  disabled={!selectedClient || !bioReason || awardingBio}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-foreground text-sm font-medium disabled:opacity-50"
                >
                  {awardingBio ? 'Atribuindo...' : `Atribuir ${bioPoints} pts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transacoes de Pontos</h3>
              <button onClick={() => setShowTransactions(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchTransactions()}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  placeholder="Buscar por nome..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTransactions ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-14 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-foreground-muted py-8">Nenhuma transacao encontrada</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-background-elevated rounded-lg">
                      <div>
                        <p className="text-sm text-foreground">{tx.user_name || tx.user_id.substring(0, 8)}</p>
                        <p className="text-xs text-foreground-secondary">{tx.reason}</p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-dourado font-bold">+{tx.points}</span>
                        <span className="block text-xs text-foreground-muted">{tx.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

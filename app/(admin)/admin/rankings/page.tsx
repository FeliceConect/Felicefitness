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
        const res = await fetch('/api/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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
    setShowForm(true)
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-dourado" />
            Rankings & Gamificacao
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerenciar rankings, pontuacao e bioimpedancia
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBioModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-vinho text-white rounded-lg text-sm font-medium hover:bg-vinho/80 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Bioimpedancia
          </button>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Transacoes
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-white rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
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
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum ranking criado</p>
          <button onClick={openNew} className="mt-3 text-dourado text-sm font-medium hover:text-dourado/80">
            Criar primeiro ranking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map(ranking => (
            <div
              key={ranking.id}
              className={`bg-slate-800 border rounded-xl p-4 ${
                ranking.is_active ? 'border-dourado/30' : 'border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{ranking.name}</h3>
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
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(ranking)}
                    className={`p-1.5 rounded-lg hover:bg-slate-700 ${
                      ranking.is_active ? 'text-green-400' : 'text-slate-500'
                    }`}
                  >
                    {ranking.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {ranking.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{ranking.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500">
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
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                {editingRanking ? 'Editar Ranking' : 'Novo Ranking'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingRanking(null) }} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  placeholder="Ex: Ranking Geral 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {RANKING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Data Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descricao</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Descricao do ranking..."
                />
              </div>

              {!editingRanking && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.add_all_clients}
                    onChange={e => setForm(f => ({ ...f, add_all_clients: e.target.checked }))}
                    className="rounded border-slate-600 text-dourado focus:ring-dourado"
                  />
                  <span className="text-sm text-slate-300">Adicionar todos os pacientes automaticamente</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingRanking(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
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
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-dourado" />
                Pontos Bioimpedancia
              </h3>
              <button onClick={() => setShowBioModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Paciente *</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                >
                  <option value="">Selecione</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome || c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
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
                <div className="flex justify-between text-xs text-slate-500">
                  <span>20</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Justificativa *</label>
                <textarea
                  value={bioReason}
                  onChange={e => setBioReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Ex: Reducao de 2% gordura corporal"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={awardBioPoints}
                  disabled={!selectedClient || !bioReason || awardingBio}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium disabled:opacity-50"
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
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Transacoes de Pontos</h3>
              <button onClick={() => setShowTransactions(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchTransactions()}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm"
                  placeholder="Buscar por nome..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTransactions ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-14 bg-slate-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhuma transacao encontrada</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div>
                        <p className="text-sm text-white">{tx.user_name || tx.user_id.substring(0, 8)}</p>
                        <p className="text-xs text-slate-400">{tx.reason}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-dourado font-bold">+{tx.points}</span>
                        <span className="block text-xs text-slate-500">{tx.source}</span>
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

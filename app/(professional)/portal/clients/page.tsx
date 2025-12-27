"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Users,
  Utensils,
  Dumbbell,
  Droplets,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface Client {
  id: string
  nome: string | null
  email: string | null
  foto: string | null
  peso: number | null
  altura: number | null
  objetivo: string | null
  assignedAt: string
  notes: string | null
  isActive: boolean
  lastActivity: string | null
  daysSinceActivity: number | null
  status: 'active' | 'warning' | 'inactive'
  weekStats: {
    meals: number
    avgDailyCalories: number
    avgDailyProtein: number
    workouts: number
    workoutDays: number
    totalWorkoutMinutes: number
    avgDailyWater: number
  }
}

export default function ClientsPage() {
  const { isNutritionist, isTrainer } = useProfessional()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/professional/clients')
        const data = await response.json()

        if (data.success) {
          setClients(data.clients)
          setFilteredClients(data.clients)
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    let filtered = clients

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c =>
        c.nome?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [search, statusFilter, clients])

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" /> Ativo
          </span>
        )
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
            <Clock className="w-3 h-3" /> Atenção
          </span>
        )
      case 'inactive':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
            <AlertCircle className="w-3 h-3" /> Inativo
          </span>
        )
    }
  }

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Nunca'
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Meus Clientes</h1>
        <p className="text-slate-400">Gerencie e acompanhe seus clientes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="warning">Precisam atenção</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Users className="w-4 h-4" />
            Total
          </div>
          <p className="text-2xl font-bold text-white mt-1">{clients.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Ativos
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {clients.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock className="w-4 h-4" />
            Atenção
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {clients.filter(c => c.status === 'warning').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            Inativos
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {clients.filter(c => c.status === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {clients.length === 0 ? 'Nenhum cliente atribuído' : 'Nenhum cliente encontrado'}
          </h3>
          <p className="text-slate-400">
            {clients.length === 0
              ? 'Quando você tiver clientes atribuídos, eles aparecerão aqui.'
              : 'Tente ajustar os filtros de busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/portal/clients/${client.id}`}
              className="block bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-violet-500/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {client.foto ? (
                    <img src={client.foto} alt={client.nome || ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-violet-400 text-xl font-medium">
                      {(client.nome || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {client.nome || 'Cliente'}
                    </h3>
                    {getStatusBadge(client.status)}
                  </div>
                  <p className="text-sm text-slate-400 truncate mb-2">{client.email}</p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {client.objetivo && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Target className="w-4 h-4 text-violet-400" />
                        {client.objetivo}
                      </div>
                    )}
                    {isNutritionist && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Utensils className="w-4 h-4 text-green-400" />
                        {client.weekStats.meals} refeições
                      </div>
                    )}
                    {isTrainer && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Dumbbell className="w-4 h-4 text-orange-400" />
                        {client.weekStats.workouts} treinos
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-300">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      {client.weekStats.avgDailyWater}ml/dia
                    </div>
                  </div>

                  {/* Week Summary */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {isNutritionist && (
                      <>
                        <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                          ~{client.weekStats.avgDailyCalories} kcal/dia
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                          ~{client.weekStats.avgDailyProtein}g proteína/dia
                        </span>
                      </>
                    )}
                    {isTrainer && (
                      <>
                        <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                          {client.weekStats.workoutDays} dias treinando
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                          {client.weekStats.totalWorkoutMinutes}min total
                        </span>
                      </>
                    )}
                    <span className="px-2 py-1 bg-slate-700 rounded text-slate-400">
                      Última atividade: {formatLastActivity(client.lastActivity)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  UserCircle,
  Flame,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface Patient {
  id: string
  nome: string
  email: string
  avatar_url?: string
  objetivo?: string
  streak_atual?: number
  nivel?: number
  xp_total?: number
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PacientesPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        role: 'client',
      })
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setPatients(data.users || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
        <p className="text-foreground-secondary">Visão completa dos pacientes do programa</p>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl p-4 border border-border">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-elevated border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-dourado hover:bg-dourado/90 text-foreground rounded-lg transition-colors font-medium"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Contagem */}
      <div className="text-sm text-foreground-secondary">
        {pagination.total} paciente(s) encontrado(s)
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-dourado animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-foreground-secondary">
            <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum paciente encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-elevated">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Membro desde
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Objetivo
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Streak
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Nível / XP
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-background-elevated cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/pacientes/${patient.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center flex-shrink-0">
                            {patient.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={patient.avatar_url}
                                alt={patient.nome}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-dourado font-medium">
                                {patient.nome?.charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-foreground font-medium">{patient.nome || 'Sem nome'}</p>
                            <p className="text-sm text-foreground-secondary">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-secondary">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-muted">
                        {patient.objetivo || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {patient.streak_atual ? (
                          <span className="inline-flex items-center gap-1 text-orange-400 text-sm font-medium">
                            <Flame className="w-4 h-4" />
                            {patient.streak_atual}
                          </span>
                        ) : (
                          <span className="text-foreground-muted text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1 text-dourado text-sm font-medium">
                            <Star className="w-4 h-4" />
                            {patient.nivel || 1}
                          </span>
                          <span className="text-foreground-muted text-xs">
                            {patient.xp_total || 0} XP
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/pacientes/${patient.id}`)
                          }}
                          className="px-3 py-1.5 bg-dourado/20 text-dourado hover:bg-dourado/30 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => router.push(`/admin/pacientes/${patient.id}`)}
                  className="w-full p-4 text-left hover:bg-background-elevated transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-dourado/20 flex items-center justify-center flex-shrink-0">
                      {patient.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={patient.avatar_url}
                          alt={patient.nome}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-dourado font-medium text-lg">
                          {patient.nome?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{patient.nome || 'Sem nome'}</p>
                      <p className="text-sm text-foreground-secondary truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-foreground-muted">Desde {formatDate(patient.created_at)}</span>
                    {patient.objetivo && (
                      <span className="px-2 py-0.5 bg-background-elevated text-foreground-muted rounded">
                        {patient.objetivo}
                      </span>
                    )}
                    {patient.streak_atual ? (
                      <span className="inline-flex items-center gap-1 text-orange-400">
                        <Flame className="w-3 h-3" />
                        {patient.streak_atual}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-dourado">
                      <Trophy className="w-3 h-3" />
                      Nível {patient.nivel || 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-foreground-secondary">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg bg-background-elevated text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg bg-background-elevated text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

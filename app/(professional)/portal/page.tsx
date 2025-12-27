"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Utensils,
  Dumbbell,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  Activity
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

interface DashboardStats {
  totalClients: number
  activeToday: number
  maxClients: number
  mealsToday: number
  mealsTotal: number
  workoutsToday: number
  workoutsTotal: number
}

interface RecentActivity {
  type: string
  clientName: string
  clientId: string
  date: string
  details: string
}

interface NeedsAttention {
  id: string
  name: string
  lastActivity: string | null
}

export default function ProfessionalDashboard() {
  const { isNutritionist, isTrainer } = useProfessional()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [needsAttention, setNeedsAttention] = useState<NeedsAttention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/professional/dashboard')
        const data = await response.json()

        if (data.success) {
          setStats(data.stats)
          setRecentActivity(data.recentActivity || [])
          setNeedsAttention(data.needsAttention || [])
        }
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
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
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">
          {isNutritionist ? 'Acompanhe a alimentação dos seus clientes' : 'Acompanhe os treinos dos seus clientes'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Meus Clientes</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalClients || 0}
                <span className="text-sm text-slate-500 font-normal">/{stats?.maxClients || 30}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.activeToday || 0} ativos hoje
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Atividade Hoje */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">
                {isNutritionist ? 'Refeições Hoje' : 'Treinos Hoje'}
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {isNutritionist ? stats?.mealsToday || 0 : stats?.workoutsToday || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isNutritionist
                  ? `${stats?.mealsTotal || 0} no mês`
                  : `${stats?.workoutsTotal || 0} no mês`}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isNutritionist
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-orange-500 to-red-600'
            }`}>
              {isNutritionist ? (
                <Utensils className="w-6 h-6 text-white" />
              ) : (
                <Dumbbell className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Taxa de Atividade */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Taxa de Atividade</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalClients
                  ? Math.round((stats.activeToday / stats.totalClients) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clientes ativos hoje
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Precisam de Atenção */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Precisam Atenção</p>
              <p className="text-2xl font-bold text-white mt-1">
                {needsAttention.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sem atividade há 3+ dias
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Atividade Recente</h2>
            </div>
            <Link
              href="/portal/clients"
              className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                Nenhuma atividade recente dos clientes
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <Link
                    key={index}
                    href={`/portal/clients/${activity.clientId}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'meal'
                        ? 'bg-green-500/20'
                        : 'bg-orange-500/20'
                    }`}>
                      {activity.type === 'meal' ? (
                        <Utensils className="w-5 h-5 text-green-400" />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {activity.clientName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {activity.details}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(activity.date)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clientes que Precisam de Atenção */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Precisam de Atenção</h2>
            </div>
          </div>
          <div className="p-4">
            {needsAttention.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-slate-400">
                  Todos os clientes estão ativos!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((client) => (
                  <Link
                    key={client.id}
                    href={`/portal/clients/${client.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{client.name}</p>
                      <p className="text-xs text-amber-400">
                        {client.lastActivity
                          ? `Última atividade: ${formatDate(client.lastActivity)}`
                          : 'Sem atividade registrada'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/portal/clients"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
          >
            <Users className="w-6 h-6 text-violet-400" />
            <span className="text-sm text-slate-300 text-center">Ver Clientes</span>
          </Link>
          {isNutritionist && (
            <>
              <Link
                href="/portal/meals"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <Utensils className="w-6 h-6 text-green-400" />
                <span className="text-sm text-slate-300 text-center">Refeicoes</span>
              </Link>
              <Link
                href="/portal/nutrition"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-colors"
              >
                <Utensils className="w-6 h-6 text-green-400" />
                <span className="text-sm text-slate-300 text-center">Planos Alimentares</span>
              </Link>
            </>
          )}
          {isTrainer && (
            <>
              <Link
                href="/portal/workouts"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <Dumbbell className="w-6 h-6 text-orange-400" />
                <span className="text-sm text-slate-300 text-center">Treinos</span>
              </Link>
              <Link
                href="/portal/training"
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 transition-colors"
              >
                <Dumbbell className="w-6 h-6 text-orange-400" />
                <span className="text-sm text-slate-300 text-center">Planos de Treino</span>
              </Link>
            </>
          )}
          <Link
            href="/portal/messages"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
          >
            <Activity className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-slate-300 text-center">Mensagens</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  UserCog,
  Activity,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Trophy,
  Calendar
} from 'lucide-react'

interface DashboardStats {
  totalClients: number
  totalProfessionals: number
  activeToday: number
  complianceRate: number
  apiCostMonth: number
  clientsAtRisk: number
}

interface RecentActivity {
  id: string
  type: 'workout' | 'meal' | 'login'
  userName: string
  description: string
  time: string
}

interface TopPerformer {
  name: string
  points: number
  position: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProfessionals: 0,
    activeToday: 0,
    complianceRate: 0,
    apiCostMonth: 0,
    clientsAtRisk: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
        setTopPerformers(data.topPerformers || [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+3 este mês'
    },
    {
      title: 'Profissionais',
      value: stats.totalProfessionals,
      icon: UserCog,
      color: 'from-violet-500 to-purple-600',
      change: 'Ativos'
    },
    {
      title: 'Ativos Hoje',
      value: stats.activeToday,
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      change: `${Math.round((stats.activeToday / Math.max(stats.totalClients, 1)) * 100)}% do total`
    },
    {
      title: 'Taxa de Adesão',
      value: `${stats.complianceRate}%`,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      change: 'Média geral'
    },
    {
      title: 'Custo API (Mês)',
      value: `R$ ${stats.apiCostMonth.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-cyan-500 to-teal-600',
      change: 'Dezembro'
    },
    {
      title: 'Clientes em Risco',
      value: stats.clientsAtRisk,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      change: 'Sem atividade'
    }
  ]

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Visão geral do sistema Complexo Wellness</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-800 rounded-xl p-5 border border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Atividade Recente</h2>
          </div>
          <div className="p-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'workout' ? 'bg-green-500/20 text-green-400' :
                      activity.type === 'meal' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {activity.type === 'workout' ? '💪' :
                       activity.type === 'meal' ? '🥗' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Top Performers
            </h2>
          </div>
          <div className="p-4">
            {topPerformers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum ranking ativo no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((performer) => (
                  <div
                    key={performer.position}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      performer.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                      performer.position === 2 ? 'bg-slate-400/20 text-slate-300' :
                      performer.position === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-600/50 text-slate-400'
                    }`}>
                      {performer.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{performer.name}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-400">{performer.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alertas e Notificações
          </h2>
        </div>
        <div className="p-4">
          {stats.clientsAtRisk > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm text-white font-medium">
                    {stats.clientsAtRisk} cliente(s) sem atividade há mais de 3 dias
                  </p>
                  <p className="text-xs text-slate-400">
                    Considere entrar em contato para verificar se precisam de ajuda
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p>Nenhum alerta no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Cpu,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

interface CostSummary {
  totalCostUSD: number
  totalCostBRL: number
  totalTokensInput: number
  totalTokensOutput: number
  totalRequests: number
  costChange: number
  exchangeRate: number
}

interface FeatureUsage {
  feature: string
  count: number
  costUSD: number
  costBRL: number
  tokens: number
}

interface ModelUsage {
  model: string
  count: number
  costUSD: number
  costBRL: number
}

interface DailyUsage {
  date: string
  costUSD: number
  costBRL: number
}

interface TopUser {
  id: string
  nome: string
  email: string
  costUSD: number
  costBRL: number
  requests: number
}

const featureLabels: Record<string, string> = {
  'food_analysis': 'Análise de Alimentos',
  'coach': 'Coach IA',
  'insights': 'Insights',
  'unknown': 'Outros'
}

export default function CostsPage() {
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [byFeature, setByFeature] = useState<FeatureUsage[]>([])
  const [byModel, setByModel] = useState<ModelUsage[]>([])
  const [byDay, setByDay] = useState<DailyUsage[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const fetchCosts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/costs?period=${period}`)
      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)
        setByFeature(data.byFeature || [])
        setByModel(data.byModel || [])
        setByDay(data.byDay || [])
        setTopUsers(data.topUsers || [])
      }
    } catch (error) {
      console.error('Erro ao buscar custos:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchCosts()
  }, [fetchCosts])

  const formatCurrency = (value: number, currency: 'USD' | 'BRL' = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('pt-BR')
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoje'
      case 'week': return 'Últimos 7 dias'
      case 'month': return 'Este mês'
      default: return ''
    }
  }

  // Calcular altura máxima do gráfico
  const maxDailyCost = Math.max(...byDay.map(d => d.costBRL), 0.01)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custos de API</h1>
          <p className="text-foreground-secondary">Monitoramento de uso e custos da OpenAI</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-foreground-secondary" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
          >
            <option value="day">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Este mês</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost BRL */}
        <div className="bg-white rounded-xl p-5 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Custo Total (BRL)</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(summary?.totalCostBRL || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {summary && summary.costChange !== 0 && (
                  <>
                    {summary.costChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-400" />
                    )}
                    <span className={`text-xs ${summary.costChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.abs(summary.costChange).toFixed(1)}% vs anterior
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>

        {/* Total Cost USD */}
        <div className="bg-white rounded-xl p-5 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Custo Total (USD)</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(summary?.totalCostUSD || 0, 'USD')}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Taxa: R$ {summary?.exchangeRate?.toFixed(2) || '5.50'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="bg-white rounded-xl p-5 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Total de Tokens</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatNumber((summary?.totalTokensInput || 0) + (summary?.totalTokensOutput || 0))}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                In: {formatNumber(summary?.totalTokensInput || 0)} | Out: {formatNumber(summary?.totalTokensOutput || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dourado to-dourado/80 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white rounded-xl p-5 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground-secondary text-sm">Requisições</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatNumber(summary?.totalRequests || 0)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {getPeriodLabel()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Feature */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Por Funcionalidade</h2>
          </div>
          <div className="p-4">
            {byFeature.length === 0 ? (
              <p className="text-center text-foreground-secondary py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {byFeature.map((item) => {
                  const maxCost = Math.max(...byFeature.map(f => f.costBRL))
                  const percentage = maxCost > 0 ? (item.costBRL / maxCost) * 100 : 0
                  return (
                    <div key={item.feature}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">
                          {featureLabels[item.feature] || item.feature}
                        </span>
                        <span className="text-sm text-foreground-secondary">
                          {formatCurrency(item.costBRL)}
                        </span>
                      </div>
                      <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-dourado to-dourado/80 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-foreground-muted mt-1">
                        <span>{item.count} requisições</span>
                        <span>{formatNumber(item.tokens)} tokens</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* By Model */}
        <div className="bg-white rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Por Modelo</h2>
          </div>
          <div className="p-4">
            {byModel.length === 0 ? (
              <p className="text-center text-foreground-secondary py-4">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {byModel.map((item) => {
                  const maxCost = Math.max(...byModel.map(m => m.costBRL))
                  const percentage = maxCost > 0 ? (item.costBRL / maxCost) * 100 : 0
                  return (
                    <div key={item.model}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground font-mono">
                          {item.model}
                        </span>
                        <span className="text-sm text-foreground-secondary">
                          {formatCurrency(item.costBRL)}
                        </span>
                      </div>
                      <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-foreground-muted mt-1">
                        {item.count} requisições
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Custos por Dia</h2>
        </div>
        <div className="p-4">
          {byDay.length === 0 ? (
            <p className="text-center text-foreground-secondary py-8">Nenhum dado disponível</p>
          ) : (
            <div className="h-48 flex items-end gap-1">
              {byDay.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-gradient-to-t from-dourado to-dourado/70 rounded-t hover:from-dourado/90 hover:to-dourado/60 transition-colors cursor-pointer group relative"
                    style={{
                      height: `${Math.max((day.costBRL / maxDailyCost) * 100, 2)}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-background text-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                        {formatCurrency(day.costBRL)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-foreground-muted -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-foreground-secondary" />
          <h2 className="text-lg font-semibold text-foreground">Top Usuários por Custo</h2>
        </div>
        <div className="p-4">
          {topUsers.length === 0 ? (
            <p className="text-center text-foreground-secondary py-4">Nenhum dado disponível</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-foreground-secondary uppercase">
                    <th className="pb-3">#</th>
                    <th className="pb-3">Usuário</th>
                    <th className="pb-3 text-right">Requisições</th>
                    <th className="pb-3 text-right">Custo (BRL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-background-elevated">
                      <td className="py-3 text-foreground-muted">{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dourado/20 flex items-center justify-center">
                            <span className="text-dourado text-sm">
                              {user.nome?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-foreground text-sm">{user.nome || 'Usuário'}</p>
                            <p className="text-xs text-foreground-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-foreground-secondary">
                        {user.requests}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatCurrency(user.costBRL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

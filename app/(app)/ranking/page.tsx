"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Zap,
} from 'lucide-react'

interface RankingData {
  id: string
  name: string
  type: string
  category: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  user_position: number | null
  user_points: number
  total_participants: number
  leaderboard: LeaderboardEntry[]
}

interface LeaderboardEntry {
  position: number
  user_id: string
  display_name: string
  total_points: number
  nivel: number
  streak: number
  is_current_user: boolean
}

interface PointTransaction {
  id: string
  points: number
  reason: string
  category: string
  source: string
  created_at: string
}

const LEVEL_NAMES = [
  '',
  'Iniciante', 'Aprendiz', 'Dedicado', 'Focado', 'Guerreiro',
  'Atleta', 'Elite', 'Campeao', 'Lenda', 'Imortal'
]

const LEVEL_COLORS = [
  '',
  'from-gray-400 to-gray-500',
  'from-green-400 to-green-500',
  'from-blue-400 to-blue-500',
  'from-purple-400 to-purple-500',
  'from-orange-400 to-orange-500',
  'from-red-400 to-red-500',
  'from-pink-400 to-pink-500',
  'from-teal-400 to-teal-500',
  'from-amber-400 to-amber-500',
  'from-yellow-400 to-yellow-500'
]

const CATEGORY_ICONS: Record<string, string> = {
  nutrition: '🥗',
  workout: '💪',
  consistency: '🔥',
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingData[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apelido, setApelido] = useState('')
  const [rankingVisivel, setRankingVisivel] = useState(true)
  const [saving, setSaving] = useState(false)

  // Points timeline
  const [recentPoints, setRecentPoints] = useState<PointTransaction[]>([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [pointsSummary, setPointsSummary] = useState({ totalPoints: 0, todayTotal: 0, monthTotal: 0 })

  // Also fetch legacy ranking for backwards compatibility
  const [legacyRanking, setLegacyRanking] = useState<{ posicao: number; xp_total: number; nivel: number; percentil: number; total_usuarios: number } | null>(null)
  const [legacyLeaderboard, setLegacyLeaderboard] = useState<{ posicao: number; apelido: string; xp_total: number; nivel: number; streak_atual: number }[]>([])

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      // Fetch multi-ranking data
      const [rankRes, legacyRes, pointsRes] = await Promise.all([
        fetch('/api/rankings?leaderboard=true&limit=20'),
        fetch('/api/ranking'),
        fetch('/api/points/award?limit=10'),
      ])

      const rankData = await rankRes.json()
      const legacyData = await legacyRes.json()
      const pointsData = await pointsRes.json()

      if (rankData.success) {
        setRankings(rankData.rankings || [])
      }

      if (legacyData.success) {
        setLegacyRanking(legacyData.userRanking)
        setLegacyLeaderboard(legacyData.leaderboard || [])
      }

      if (pointsData.success) {
        setRecentPoints(pointsData.transactions || [])
        setPointsSummary({
          totalPoints: pointsData.totalPoints || 0,
          todayTotal: pointsData.todayTotal || 0,
          monthTotal: pointsData.monthTotal || 0,
        })
      }
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apelido: apelido || null, ranking_visivel: rankingVisivel })
      })
      const data = await response.json()
      if (data.success) {
        setShowSettings(false)
        fetchData(true)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (pos === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (pos === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-foreground-secondary font-bold text-sm">{pos}</span>
  }

  const activeRanking = rankings[activeTab] || null

  // Use multi-ranking if available, otherwise fall back to legacy
  const hasMultiRankings = rankings.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-dourado animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-dourado" />
            Ranking
          </h1>
          <p className="text-sm text-foreground-secondary">Competicao anonima</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white hover:bg-background-elevated transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-foreground-secondary ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-white hover:bg-background-elevated transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h3 className="text-foreground font-medium">Configuracoes do Ranking</h3>
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">Apelido (opcional)</label>
            <input
              type="text"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="Ex: FitWarrior123"
              maxLength={50}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Aparecer no ranking</p>
              <p className="text-xs text-foreground-secondary">Outros podem ver sua posicao</p>
            </div>
            <button
              onClick={() => setRankingVisivel(!rankingVisivel)}
              className={`p-2 rounded-lg transition-colors ${rankingVisivel ? 'bg-dourado text-white' : 'bg-background-elevated text-foreground-secondary'}`}
            >
              {rankingVisivel ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-2 bg-dourado hover:bg-dourado/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Points Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-dourado">{pointsSummary.totalPoints}</p>
          <p className="text-xs text-foreground-secondary">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{pointsSummary.monthTotal}</p>
          <p className="text-xs text-foreground-secondary">Este mes</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">+{pointsSummary.todayTotal}</p>
          <p className="text-xs text-foreground-secondary">Hoje</p>
        </div>
      </div>

      {/* Ranking Tabs */}
      {hasMultiRankings && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rankings.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? 'bg-dourado text-white'
                  : 'bg-white border border-border text-foreground-secondary hover:text-foreground'
              }`}
            >
              {r.category ? `${CATEGORY_ICONS[r.category] || ''} ` : ''}
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Podium (Top 3) */}
      {(() => {
        const leaderboard = hasMultiRankings ? (activeRanking?.leaderboard || []) : legacyLeaderboard.map(e => ({
          position: e.posicao,
          display_name: e.apelido,
          total_points: e.xp_total,
          nivel: e.nivel,
          streak: e.streak_atual,
          is_current_user: false,
          user_id: '',
        }))
        const top3 = leaderboard.slice(0, 3)

        if (top3.length >= 3) {
          return (
            <div className="bg-gradient-to-br from-dourado/5 to-vinho/5 rounded-xl border border-dourado/20 p-4">
              <div className="flex items-end justify-center gap-3 mb-2">
                {/* 2nd place */}
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${LEVEL_COLORS[top3[1].nivel]} shadow-lg`}>
                    <span className="text-white font-bold text-lg">{top3[1].nivel}</span>
                  </div>
                  <div className="bg-gray-200 rounded-t-lg w-20 h-16 mt-2 flex flex-col items-center justify-center">
                    <Medal className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-bold text-foreground">2</span>
                  </div>
                  <p className="text-xs text-foreground font-medium mt-1 truncate max-w-[80px]">{top3[1].display_name}</p>
                  <p className="text-xs text-dourado font-bold">{top3[1].total_points} pts</p>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center -mt-4">
                  <Crown className="w-8 h-8 text-yellow-400 mb-1" />
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${LEVEL_COLORS[top3[0].nivel]} shadow-xl ring-2 ring-yellow-400/50`}>
                    <span className="text-white font-bold text-xl">{top3[0].nivel}</span>
                  </div>
                  <div className="bg-yellow-100 rounded-t-lg w-20 h-20 mt-2 flex flex-col items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className="text-sm font-bold text-foreground">1</span>
                  </div>
                  <p className="text-xs text-foreground font-medium mt-1 truncate max-w-[80px]">{top3[0].display_name}</p>
                  <p className="text-xs text-dourado font-bold">{top3[0].total_points} pts</p>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${LEVEL_COLORS[top3[2].nivel]} shadow-lg`}>
                    <span className="text-white font-bold text-lg">{top3[2].nivel}</span>
                  </div>
                  <div className="bg-amber-100 rounded-t-lg w-20 h-12 mt-2 flex flex-col items-center justify-center">
                    <Medal className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold text-foreground">3</span>
                  </div>
                  <p className="text-xs text-foreground font-medium mt-1 truncate max-w-[80px]">{top3[2].display_name}</p>
                  <p className="text-xs text-dourado font-bold">{top3[2].total_points} pts</p>
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* User Position Card */}
      {hasMultiRankings && activeRanking?.user_position && (
        <div className="bg-gradient-to-br from-dourado/10 to-vinho/10 rounded-xl border border-dourado/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Sua posicao</p>
              <p className="text-3xl font-bold text-foreground">#{activeRanking.user_position}</p>
              <p className="text-xs text-foreground-muted">de {activeRanking.total_participants} participantes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-secondary">Seus pontos</p>
              <p className="text-2xl font-bold text-dourado">{activeRanking.user_points}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-dourado" />
            {hasMultiRankings ? activeRanking?.name || 'Leaderboard' : 'Top Atletas'}
          </h2>
          {hasMultiRankings && activeRanking?.description && (
            <span className="text-xs text-foreground-muted">{activeRanking.description}</span>
          )}
        </div>

        {(() => {
          const leaderboard = hasMultiRankings
            ? (activeRanking?.leaderboard || [])
            : legacyLeaderboard.map(e => ({
                position: e.posicao,
                display_name: e.apelido,
                total_points: e.xp_total,
                nivel: e.nivel,
                streak: e.streak_atual,
                is_current_user: legacyRanking ? e.posicao === legacyRanking.posicao : false,
                user_id: '',
              }))

          if (leaderboard.length === 0) {
            return (
              <div className="p-8 text-center">
                <Trophy className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                <p className="text-foreground-secondary">Nenhum atleta no ranking ainda</p>
                <p className="text-sm text-foreground-muted">Complete atividades para aparecer!</p>
              </div>
            )
          }

          // Skip top 3 if podium is shown
          const startFrom = leaderboard.length >= 3 ? 3 : 0
          const restEntries = leaderboard.slice(startFrom)

          return (
            <div className="divide-y divide-border">
              {restEntries.map((entry) => (
                <div
                  key={entry.position}
                  className={`p-4 flex items-center gap-3 ${
                    entry.is_current_user ? 'bg-dourado/10' : ''
                  }`}
                >
                  <div className="w-10 flex justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${LEVEL_COLORS[entry.nivel]}`}>
                    <span className="text-white font-bold">{entry.nivel}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium truncate block ${entry.is_current_user ? 'text-dourado' : 'text-foreground'}`}>
                      {entry.display_name}
                      {entry.is_current_user && ' (voce)'}
                    </span>
                    <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                      <span>{LEVEL_NAMES[entry.nivel]}</span>
                      {entry.streak > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {entry.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-foreground font-bold">{entry.total_points.toLocaleString()}</span>
                    <span className="text-foreground-secondary text-sm ml-1">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Recent Points Timeline */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="w-full bg-white rounded-xl border border-border p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-dourado" />
            Pontos Recentes
          </h3>
          <span className="text-foreground-muted text-sm">{showTimeline ? 'Ocultar' : 'Ver'}</span>
        </div>
      </button>

      {showTimeline && recentPoints.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {recentPoints.map(tx => (
              <div key={tx.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{tx.reason}</p>
                  <p className="text-xs text-foreground-muted">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-dourado font-bold text-sm">+{tx.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-background-elevated/30 rounded-xl p-4 border border-border">
        <p className="text-sm text-foreground-secondary text-center">
          O ranking e anonimo para proteger sua privacidade. Complete atividades para ganhar pontos e subir no ranking!
        </p>
      </div>
    </div>
  )
}

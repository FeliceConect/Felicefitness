"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  TrendingUp,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  RefreshCw
} from 'lucide-react'
import { LevelBadge } from '@/components/gamification/level-badge'
import { getLevelByNumber } from '@/lib/gamification'

interface UserRanking {
  posicao: number
  xp_total: number
  nivel: number
  percentil: number
  total_usuarios: number
  proximo_acima_xp: number | null
  proximo_abaixo_xp: number | null
}

interface LeaderboardEntry {
  posicao: number
  apelido: string
  xp_total: number
  nivel: number
  streak_atual: number
  total_conquistas: number
}

const LEVEL_NAMES = [
  '',
  'Iniciante',
  'Aprendiz',
  'Dedicado',
  'Focado',
  'Guerreiro',
  'Atleta',
  'Elite',
  'Campeão',
  'Lenda',
  'Imortal'
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

export default function RankingPage() {
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apelido, setApelido] = useState('')
  const [rankingVisivel, setRankingVisivel] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchRanking = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await fetch('/api/ranking')
      const data = await response.json()

      if (data.success) {
        setUserRanking(data.userRanking)
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apelido: apelido || null,
          ranking_visivel: rankingVisivel
        })
      })
      const data = await response.json()
      if (data.success) {
        setShowSettings(false)
        fetchRanking(true)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const getPositionIcon = (posicao: number) => {
    if (posicao === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (posicao === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (posicao === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{posicao}</span>
  }

  const getPercentilLabel = (percentil: number) => {
    if (percentil >= 99) return { label: 'Top 1%', color: 'text-yellow-400' }
    if (percentil >= 95) return { label: 'Top 5%', color: 'text-purple-400' }
    if (percentil >= 90) return { label: 'Top 10%', color: 'text-blue-400' }
    if (percentil >= 75) return { label: 'Top 25%', color: 'text-green-400' }
    if (percentil >= 50) return { label: 'Top 50%', color: 'text-slate-300' }
    return { label: `Top ${Math.round(100 - percentil)}%`, color: 'text-slate-400' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/conquistas"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Ranking
            </h1>
            <p className="text-sm text-slate-400">Competição anônima</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRanking(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
          <h3 className="text-white font-medium">Configurações do Ranking</h3>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Apelido (opcional)</label>
            <input
              type="text"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="Ex: FitWarrior123"
              maxLength={50}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">Deixe vazio para usar apelido anônimo</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Aparecer no ranking</p>
              <p className="text-xs text-slate-400">Outros usuários podem ver sua posição</p>
            </div>
            <button
              onClick={() => setRankingVisivel(!rankingVisivel)}
              className={`p-2 rounded-lg transition-colors ${
                rankingVisivel ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {rankingVisivel ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}

      {/* User Position Card */}
      {userRanking && (
        <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-xl border border-violet-500/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Sua Posição</h2>
            {userRanking.percentil && (
              <span className={`text-sm font-medium ${getPercentilLabel(userRanking.percentil).color}`}>
                {getPercentilLabel(userRanking.percentil).label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Posição */}
            <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-800/50 rounded-xl">
              <span className="text-3xl font-bold text-white">#{userRanking.posicao}</span>
              <span className="text-xs text-slate-400">de {userRanking.total_usuarios}</span>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">XP Total</span>
                <span className="text-white font-bold">{userRanking.xp_total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nível</span>
                <div className="flex items-center gap-2">
                  {getLevelByNumber(userRanking.nivel) && (
                    <LevelBadge level={getLevelByNumber(userRanking.nivel)!} size="sm" showName={false} />
                  )}
                  <span className="text-white">{LEVEL_NAMES[userRanking.nivel]}</span>
                </div>
              </div>
              {userRanking.proximo_acima_xp && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ChevronUp className="w-4 h-4 text-green-400" />
                    Para subir
                  </span>
                  <span className="text-green-400">
                    +{(userRanking.proximo_acima_xp - userRanking.xp_total).toLocaleString()} XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Top Atletas
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum atleta no ranking ainda</p>
            <p className="text-sm text-slate-500">Complete atividades para aparecer!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = userRanking && entry.posicao === userRanking.posicao
              return (
                <div
                  key={index}
                  className={`p-4 flex items-center gap-3 ${
                    isCurrentUser ? 'bg-violet-600/10' : ''
                  } ${entry.posicao <= 3 ? 'bg-gradient-to-r from-slate-800 to-slate-800/50' : ''}`}
                >
                  {/* Position */}
                  <div className="w-10 flex justify-center">
                    {getPositionIcon(entry.posicao)}
                  </div>

                  {/* Avatar/Level */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${LEVEL_COLORS[entry.nivel]}`}>
                    <span className="text-white font-bold text-lg">{entry.nivel}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCurrentUser ? 'text-violet-400' : 'text-white'}`}>
                        {entry.apelido}
                        {isCurrentUser && ' (você)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{LEVEL_NAMES[entry.nivel]}</span>
                      {entry.streak_atual > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {entry.streak_atual}
                        </span>
                      )}
                      {entry.total_conquistas > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {entry.total_conquistas}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <span className="text-white font-bold">{entry.xp_total.toLocaleString()}</span>
                    <span className="text-slate-400 text-sm ml-1">XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
        <p className="text-sm text-slate-400 text-center">
          O ranking é anônimo para proteger sua privacidade. Você pode escolher um apelido
          ou deixar que o sistema gere um para você. Complete atividades para ganhar XP e subir no ranking!
        </p>
      </div>
    </div>
  )
}

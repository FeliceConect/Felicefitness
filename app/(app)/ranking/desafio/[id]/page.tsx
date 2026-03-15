/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Crown,
  Medal,
  Trophy,
  Users,
  Calendar,
  Loader2,
  Swords,
} from 'lucide-react'
import Link from 'next/link'

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  bronze: { label: 'Bronze', icon: '🥉', color: 'text-amber-700' },
  prata: { label: 'Prata', icon: '🥈', color: 'text-gray-500' },
  ouro: { label: 'Ouro', icon: '🥇', color: 'text-yellow-500' },
  platina: { label: 'Platina', icon: '💎', color: 'text-cyan-400' },
}

interface ChallengeDetail {
  id: string
  title: string
  description: string
  challenge_type: string
  scoring_category: string | null
  start_date: string
  end_date: string
  is_active: boolean
}

interface LeaderboardEntry {
  position: number
  user_id: string
  name: string
  tier: string
  score: number
  is_self: boolean
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userPosition, setUserPosition] = useState<number | null>(null)
  const [userScore, setUserScore] = useState(0)
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setChallenge(data.challenge)
        setLeaderboard(data.leaderboard || [])
        setUserPosition(data.user_position)
        setUserScore(data.user_score)
        setIsJoined(data.is_joined)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await fetch(`/api/challenges/${params.id}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setIsJoined(true)
        fetchChallenge()
      }
    } catch {
      // silent
    } finally {
      setJoining(false)
    }
  }

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-5 h-5 text-yellow-400" />
    if (pos === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (pos === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-foreground-secondary font-bold text-xs">{pos}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-dourado animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground-secondary">Desafio não encontrado</p>
        <Link href="/ranking" className="text-dourado text-sm mt-2 inline-block">
          Voltar ao ranking
        </Link>
      </div>
    )
  }

  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isActive = challenge.is_active && daysLeft > 0

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-white border border-border hover:bg-background-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2 truncate">
            <Swords className="w-5 h-5 text-vinho shrink-0" />
            {challenge.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(challenge.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {new Date(challenge.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {leaderboard.length} participantes
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {challenge.description && (
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-foreground-secondary">{challenge.description}</p>
        </div>
      )}

      {/* User Status / Join */}
      {isJoined ? (
        <div className="bg-gradient-to-br from-dourado/10 to-vinho/10 rounded-xl border border-dourado/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Sua posição</p>
              <p className="text-3xl font-bold text-foreground">
                {userPosition ? `#${userPosition}` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-secondary">Sua pontuação</p>
              <p className="text-2xl font-bold text-dourado">{userScore}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {isActive ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{daysLeft}d restantes</span>
            ) : (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Encerrado</span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-4 text-center space-y-3">
          <p className="text-sm text-foreground-secondary">
            {isActive ? 'Entre neste desafio e compete com outros participantes!' : 'Este desafio já encerrou.'}
          </p>
          {isActive && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-6 py-2.5 bg-dourado text-white rounded-full text-sm font-semibold hover:bg-dourado/90 transition-colors disabled:opacity-50"
            >
              {joining ? 'Entrando...' : 'Participar'}
            </button>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-dourado" />
            Classificação
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-secondary">Nenhum participante ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaderboard.map(entry => {
              const tier = TIER_CONFIG[entry.tier] || TIER_CONFIG.bronze
              return (
                <div
                  key={entry.user_id}
                  className={`p-4 flex items-center gap-3 ${entry.is_self ? 'bg-dourado/10' : ''}`}
                >
                  <div className="w-8 flex justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium truncate ${entry.is_self ? 'text-dourado' : 'text-foreground'}`}>
                        {entry.name}
                        {entry.is_self && ' (você)'}
                      </span>
                      <span className="text-xs" title={tier.label}>{tier.icon}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-foreground font-bold">{entry.score}</span>
                    <span className="text-foreground-secondary text-sm ml-1">pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-background-elevated/30 rounded-xl p-4 border border-border">
        <p className="text-sm text-foreground-secondary text-center">
          Pontos ganhos durante o período do desafio são contabilizados automaticamente.
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Trophy, Calendar, Info } from 'lucide-react'
import { format, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExerciseChart } from '@/components/treino/exercise-chart'
import { YouTubeEmbed } from '@/components/shared/youtube-embed'
import { getExercisePR } from '@/lib/workout/mock-data'
import { cn } from '@/lib/utils'

interface ExerciseExecution {
  date: string
  weight: number
  reps: number
  volume: number
  isPR: boolean
}

interface ExerciseInfo {
  id: string
  nome: string
  grupoMuscular: string
  descricao: string
  instrucoes: string[]
  dicas: string[]
  videoUrl?: string
}

interface DBExercise {
  id: string
  nome: string
  grupo_muscular: string
  instrucoes?: string | null
  video_url?: string | null
  dificuldade?: string | null
  equipamento?: string | null
}

// Fallback mock exercise data
function getMockExerciseInfo(id: string): ExerciseInfo {
  const exercises: Record<string, ExerciseInfo> = {
    'ex-leg-press': {
      id: 'ex-leg-press',
      nome: 'Leg Press',
      grupoMuscular: 'Pernas',
      descricao: 'Exercicio composto para desenvolvimento de quadriceps, gluteos e posterior de coxa.',
      instrucoes: [
        'Sente-se na maquina com as costas apoiadas no encosto',
        'Posicione os pes na plataforma na largura dos ombros',
        'Empurre a plataforma estendendo as pernas (nao trave os joelhos)',
        'Desca controladamente ate 90 graus de flexao',
        'Repita o movimento mantendo a tensao'
      ],
      dicas: [
        'Nao trave os joelhos no topo do movimento',
        'Mantenha as costas sempre apoiadas no encosto',
        'Controle a descida - nao deixe o peso cair',
        'Respire: expire ao empurrar, inspire ao descer'
      ]
    },
    'ex-agach-goblet': {
      id: 'ex-agach-goblet',
      nome: 'Agachamento Goblet',
      grupoMuscular: 'Pernas',
      descricao: 'Variacao de agachamento com haltere que ajuda na postura e ativacao do core.',
      instrucoes: [
        'Segure o haltere na altura do peito',
        'Pes na largura dos ombros, pontas ligeiramente para fora',
        'Desca mantendo o tronco ereto',
        'Desca ate as coxas ficarem paralelas ao chao',
        'Suba empurrando o chao com os calcanhares'
      ],
      dicas: [
        'Mantenha os cotovelos apontando para baixo',
        'Joelhos devem seguir a direcao dos pes',
        'Core contraido durante todo o movimento',
        'Se necessario, use elevacao nos calcanhares'
      ]
    }
  }

  return exercises[id] || {
    id,
    nome: 'Exercicio',
    grupoMuscular: 'Geral',
    descricao: 'Descricao nao disponivel',
    instrucoes: [],
    dicas: []
  }
}

// Mock exercise history
function getMockExerciseHistory(id: string): ExerciseExecution[] {
  const history: ExerciseExecution[] = []
  const baseWeight = id === 'ex-leg-press' ? 70 : 15

  for (let i = 8; i >= 0; i--) {
    const date = subWeeks(new Date(), i)
    const weight = baseWeight + Math.floor((8 - i) * 2.5) + (Math.random() * 5 - 2.5)
    const reps = 10 + Math.floor(Math.random() * 4)
    const isPR = i <= 1 && Math.random() > 0.6

    history.push({
      date: format(date, 'yyyy-MM-dd'),
      weight: Math.round(weight),
      reps,
      volume: Math.round(weight * reps * 3),
      isPR
    })
  }

  return history
}

type ChartMetric = 'weight' | 'volume' | 'reps'

const metricButtons: Array<{ key: ChartMetric; label: string }> = [
  { key: 'weight', label: 'Carga' },
  { key: 'volume', label: 'Volume' },
  { key: 'reps', label: 'Reps' }
]

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const exerciseId = params.id as string

  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('weight')
  const [showInstructions, setShowInstructions] = useState(false)
  const [dbExercise, setDbExercise] = useState<DBExercise | null>(null)

  // Fetch real exercise data from DB
  useEffect(() => {
    async function fetchExercise() {
      try {
        const res = await fetch(`/api/portal/exercises/${exerciseId}`)
        const data = await res.json()
        if (data.success && data.exercise) {
          setDbExercise(data.exercise)
        }
      } catch {
        // Fallback to mock data - no error needed
      }
    }
    fetchExercise()
  }, [exerciseId])

  // Merge DB data with mock fallback
  const mockInfo = useMemo(() => getMockExerciseInfo(exerciseId), [exerciseId])
  const exerciseInfo: ExerciseInfo = useMemo(() => {
    if (!dbExercise) return mockInfo
    const instrucoes = dbExercise.instrucoes
      ? dbExercise.instrucoes.split('\n').filter(Boolean)
      : mockInfo.instrucoes
    return {
      id: dbExercise.id,
      nome: dbExercise.nome,
      grupoMuscular: dbExercise.grupo_muscular,
      descricao: dbExercise.equipamento
        ? `${dbExercise.grupo_muscular} | ${dbExercise.equipamento}${dbExercise.dificuldade ? ` | ${dbExercise.dificuldade}` : ''}`
        : mockInfo.descricao,
      instrucoes,
      dicas: mockInfo.dicas,
      videoUrl: dbExercise.video_url || undefined,
    }
  }, [dbExercise, mockInfo])

  const history = useMemo(() => getMockExerciseHistory(exerciseId), [exerciseId])
  const currentPR = getExercisePR(exerciseId)

  const stats = useMemo(() => {
    if (history.length === 0) return null
    const latest = history[history.length - 1]
    const first = history[0]
    const maxWeight = Math.max(...history.map(h => h.weight))
    const improvement = ((latest.weight - first.weight) / first.weight * 100).toFixed(1)
    return {
      lastWeight: latest.weight,
      maxWeight,
      improvement,
      totalSessions: history.length
    }
  }, [history])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-dourado/20 to-transparent" />
        <div className="relative px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs text-dourado font-medium uppercase tracking-wide">
              {exerciseInfo.grupoMuscular}
            </span>
            <h1 className="text-2xl font-bold text-foreground mt-1 mb-2">
              {exerciseInfo.nome}
            </h1>
            <p className="text-foreground-secondary text-sm">{exerciseInfo.descricao}</p>
          </motion.div>
        </div>
      </div>

      {/* Video */}
      {exerciseInfo.videoUrl && (
        <div className="px-4 mt-6">
          <YouTubeEmbed url={exerciseInfo.videoUrl} title={exerciseInfo.nome} />
        </div>
      )}

      {/* PR Badge */}
      {currentPR && (
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Recorde Pessoal</p>
                <p className="text-lg font-bold text-foreground">
                  {currentPR.weight}kg x {currentPR.reps} reps
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="px-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-dourado">{stats.maxWeight}</p>
              <p className="text-xs text-foreground-secondary">kg max</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">+{stats.improvement}%</p>
              <p className="text-xs text-foreground-secondary">progresso</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-dourado">{stats.totalSessions}</p>
              <p className="text-xs text-foreground-secondary">sessoes</p>
            </div>
          </div>
        </div>
      )}

      {/* Evolution chart */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-dourado" />
            Evolucao
          </h2>
          <div className="flex bg-white rounded-lg p-1">
            {metricButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  selectedMetric === key
                    ? 'bg-dourado text-white'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <ExerciseChart data={history} metric={selectedMetric} />
        </div>
      </div>

      {/* Instructions toggle */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full bg-white border border-border rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-dourado" />
            <span className="text-foreground font-medium">Instrucoes do exercicio</span>
          </div>
          <motion.span animate={{ rotate: showInstructions ? 180 : 0 }} className="text-foreground-secondary">
            ▼
          </motion.span>
        </button>

        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-4"
          >
            {exerciseInfo.instrucoes.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground-secondary mb-3">Como fazer</h3>
                <ol className="space-y-2">
                  {exerciseInfo.instrucoes.map((instrucao, index) => (
                    <li key={index} className="flex gap-3 text-sm text-foreground-secondary">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-dourado/20 text-dourado text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {instrucao}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {exerciseInfo.dicas.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground-secondary mb-3">Dicas</h3>
                <ul className="space-y-2">
                  {exerciseInfo.dicas.map((dica, index) => (
                    <li key={index} className="flex gap-3 text-sm text-foreground-secondary">
                      <span className="text-emerald-400">💡</span>
                      {dica}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Recent history */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-dourado" />
          Historico recente
        </h2>
        <div className="space-y-2">
          {history.slice(-5).reverse().map((session, index) => (
            <motion.div
              key={session.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'bg-white border rounded-xl p-4 flex items-center justify-between',
                session.isPR ? 'border-amber-500/30' : 'border-border'
              )}
            >
              <div>
                <p className="text-foreground font-medium">
                  {session.weight}kg x {session.reps} reps
                </p>
                <p className="text-sm text-foreground-secondary">
                  {format(new Date(session.date), "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              {session.isPR && (
                <span className="text-amber-400 text-sm font-medium">🏆 PR</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

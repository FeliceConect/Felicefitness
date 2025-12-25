"use client"

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Trophy, Calendar, Info } from 'lucide-react'
import { format, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExerciseChart } from '@/components/treino/exercise-chart'
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

// Mock exercise data
function getMockExerciseInfo(id: string): ExerciseInfo {
  const exercises: Record<string, ExerciseInfo> = {
    'ex-leg-press': {
      id: 'ex-leg-press',
      nome: 'Leg Press',
      grupoMuscular: 'Pernas',
      descricao: 'Exercício composto para desenvolvimento de quadríceps, glúteos e posterior de coxa.',
      instrucoes: [
        'Sente-se na máquina com as costas apoiadas no encosto',
        'Posicione os pés na plataforma na largura dos ombros',
        'Empurre a plataforma estendendo as pernas (não trave os joelhos)',
        'Desça controladamente até 90 graus de flexão',
        'Repita o movimento mantendo a tensão'
      ],
      dicas: [
        'Não trave os joelhos no topo do movimento',
        'Mantenha as costas sempre apoiadas no encosto',
        'Controle a descida - não deixe o peso cair',
        'Respire: expire ao empurrar, inspire ao descer'
      ]
    },
    'ex-agach-goblet': {
      id: 'ex-agach-goblet',
      nome: 'Agachamento Goblet',
      grupoMuscular: 'Pernas',
      descricao: 'Variação de agachamento com haltere que ajuda na postura e ativação do core.',
      instrucoes: [
        'Segure o haltere na altura do peito',
        'Pés na largura dos ombros, pontas ligeiramente para fora',
        'Desça mantendo o tronco ereto',
        'Desça até as coxas ficarem paralelas ao chão',
        'Suba empurrando o chão com os calcanhares'
      ],
      dicas: [
        'Mantenha os cotovelos apontando para baixo',
        'Joelhos devem seguir a direção dos pés',
        'Core contraído durante todo o movimento',
        'Se necessário, use elevação nos calcanhares'
      ]
    }
  }

  return exercises[id] || {
    id,
    nome: 'Exercício',
    grupoMuscular: 'Geral',
    descricao: 'Descrição não disponível',
    instrucoes: [],
    dicas: []
  }
}

// Mock exercise history
function getMockExerciseHistory(id: string): ExerciseExecution[] {
  const history: ExerciseExecution[] = []
  const baseWeight = id === 'ex-leg-press' ? 70 : 15

  // Generate 8 weeks of data
  for (let i = 8; i >= 0; i--) {
    const date = subWeeks(new Date(), i)
    const weight = baseWeight + Math.floor((8 - i) * 2.5) + (Math.random() * 5 - 2.5)
    const reps = 10 + Math.floor(Math.random() * 4)
    const isPR = i <= 1 && Math.random() > 0.6

    history.push({
      date: format(date, 'yyyy-MM-dd'),
      weight: Math.round(weight),
      reps,
      volume: Math.round(weight * reps * 3), // 3 sets
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

  const exerciseInfo = useMemo(() => getMockExerciseInfo(exerciseId), [exerciseId])
  const history = useMemo(() => getMockExerciseHistory(exerciseId), [exerciseId])
  const currentPR = getExercisePR(exerciseId)

  // Stats
  const stats = useMemo(() => {
    if (history.length === 0) return null

    const latest = history[history.length - 1]
    const first = history[0]
    const maxWeight = Math.max(...history.map(h => h.weight))
    const maxVolume = Math.max(...history.map(h => h.volume))
    const improvement = ((latest.weight - first.weight) / first.weight * 100).toFixed(1)

    return {
      lastWeight: latest.weight,
      maxWeight,
      maxVolume,
      improvement,
      totalSessions: history.length
    }
  }, [history])

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-violet-500/20 to-transparent" />

        <div className="relative px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs text-violet-400 font-medium uppercase tracking-wide">
              {exerciseInfo.grupoMuscular}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1 mb-2">
              {exerciseInfo.nome}
            </h1>
            <p className="text-slate-400 text-sm">{exerciseInfo.descricao}</p>
          </motion.div>
        </div>
      </div>

      {/* PR Badge */}
      {currentPR && (
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Recorde Pessoal</p>
                  <p className="text-lg font-bold text-white">
                    {currentPR.weight}kg × {currentPR.reps} reps
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="px-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-violet-400">{stats.maxWeight}</p>
              <p className="text-xs text-slate-400">kg máx</p>
            </div>
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">+{stats.improvement}%</p>
              <p className="text-xs text-slate-400">progresso</p>
            </div>
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</p>
              <p className="text-xs text-slate-400">sessões</p>
            </div>
          </div>
        </div>
      )}

      {/* Evolution chart */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Evolução
          </h2>
          <div className="flex bg-[#14141F] rounded-lg p-1">
            {metricButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  selectedMetric === key
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
          <ExerciseChart data={history} metric={selectedMetric} />
        </div>
      </div>

      {/* Instructions toggle */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-violet-400" />
            <span className="text-white font-medium">Instruções do exercício</span>
          </div>
          <motion.span
            animate={{ rotate: showInstructions ? 180 : 0 }}
            className="text-slate-400"
          >
            ▼
          </motion.span>
        </button>

        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-4"
          >
            {/* Instructions */}
            {exerciseInfo.instrucoes.length > 0 && (
              <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Como fazer</h3>
                <ol className="space-y-2">
                  {exerciseInfo.instrucoes.map((instrucao, index) => (
                    <li key={index} className="flex gap-3 text-sm text-slate-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {instrucao}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {exerciseInfo.dicas.length > 0 && (
              <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Dicas</h3>
                <ul className="space-y-2">
                  {exerciseInfo.dicas.map((dica, index) => (
                    <li key={index} className="flex gap-3 text-sm text-slate-300">
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
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Histórico recente
        </h2>
        <div className="space-y-2">
          {history.slice(-5).reverse().map((session, index) => (
            <motion.div
              key={session.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'bg-[#14141F] border rounded-xl p-4 flex items-center justify-between',
                session.isPR ? 'border-amber-500/30' : 'border-[#2E2E3E]'
              )}
            >
              <div>
                <p className="text-white font-medium">
                  {session.weight}kg × {session.reps} reps
                </p>
                <p className="text-sm text-slate-400">
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

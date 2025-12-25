"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface HistoryWorkout {
  id: string
  nome: string
  tipo: string
  data: string
  duracao: number
  exercicios: number
  concluido: boolean
}

const typeIcons: Record<string, string> = {
  tradicional: '🏋️',
  circuito: '🔄',
  hiit: '🔥',
  mobilidade: '🧘',
}

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [history, setHistory] = useState<HistoryWorkout[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Carregar histórico do mês
  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHistory([])
        setLoading(false)
        return
      }

      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('fitness_workouts')
        .select(`
          id,
          nome,
          tipo,
          data,
          duracao_minutos,
          status,
          exercicios:fitness_workout_exercises(count)
        `)
        .eq('user_id', user.id)
        .eq('status', 'concluido')
        .gte('data', monthStart)
        .lte('data', monthEnd)
        .order('data', { ascending: false })

      if (error) throw error

      const workouts: HistoryWorkout[] = (data || []).map((w: {
        id: string
        nome: string
        tipo: string
        data: string
        duracao_minutos: number | null
        status: string
        exercicios: { count: number }[]
      }) => ({
        id: w.id,
        nome: w.nome,
        tipo: w.tipo || 'tradicional',
        data: w.data,
        duracao: w.duracao_minutos || 0,
        exercicios: w.exercicios?.[0]?.count || 0,
        concluido: w.status === 'concluido'
      }))

      setHistory(workouts)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [supabase, currentMonth])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Group by week
  const groupedByWeek = useMemo(() => {
    const groups: Record<string, HistoryWorkout[]> = {}

    history.forEach(workout => {
      const weekStart = format(new Date(workout.data), "'Semana de' d MMM", { locale: ptBR })
      if (!groups[weekStart]) {
        groups[weekStart] = []
      }
      groups[weekStart].push(workout)
    })

    return groups
  }, [history])

  // Stats for the month
  const monthStats = useMemo(() => {
    return {
      total: history.length,
      totalDuration: history.reduce((acc, w) => acc + w.duracao, 0),
      avgDuration: history.length > 0 ? Math.round(history.reduce((acc, w) => acc + w.duracao, 0) / history.length) : 0
    }
  }, [history])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white mb-4">Histórico de Treinos</h1>

        {/* Month navigation */}
        <div className="flex items-center justify-between bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>

          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <p className="text-sm text-slate-400">
              {monthStats.total} treinos • {monthStats.totalDuration}min total
            </p>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={isSameMonth(currentMonth, new Date())}
          >
            <ChevronRight className={cn(
              "w-5 h-5",
              isSameMonth(currentMonth, new Date()) ? "text-slate-700" : "text-slate-400"
            )} />
          </button>
        </div>
      </div>

      {/* Month stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{monthStats.total}</p>
            <p className="text-xs text-slate-400">treinos</p>
          </div>
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{Math.round(monthStats.totalDuration / 60)}h</p>
            <p className="text-xs text-slate-400">total</p>
          </div>
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{monthStats.avgDuration}min</p>
            <p className="text-xs text-slate-400">média</p>
          </div>
        </div>
      </div>

      {/* Workout list by week */}
      <div className="px-4">
        {Object.entries(groupedByWeek).length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-4">📅</span>
            <p className="text-slate-400">Nenhum treino neste mês</p>
          </div>
        ) : (
          Object.entries(groupedByWeek).map(([weekLabel, workouts], groupIndex) => (
            <motion.div
              key={weekLabel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="mb-6"
            >
              <h3 className="text-sm font-medium text-slate-400 mb-3">{weekLabel}</h3>
              <div className="space-y-2">
                {workouts.map((workout, index) => (
                  <Link
                    key={workout.id}
                    href={`/treino/historico/${workout.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeIcons[workout.tipo] || '🏋️'}</span>
                        <div>
                          <p className="text-white font-medium">{workout.nome}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>{format(new Date(workout.data), "EEE, d MMM", { locale: ptBR })}</span>
                            <span>•</span>
                            <span>{workout.duracao}min</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

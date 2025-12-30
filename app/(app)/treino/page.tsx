"use client"

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Calendar, Dumbbell, TrendingUp, Loader2, Play, X, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WeekCalendar } from '@/components/treino/week-calendar'
import { TodayWorkoutCard } from '@/components/treino/today-workout-card'
import { useWorkouts } from '@/hooks/use-workouts'
import { useWorkoutExecution } from '@/hooks/use-workout-execution'
import { Button } from '@/components/ui/button'
import type { DayWorkout } from '@/lib/workout/types'

const typeIcons: Record<string, string> = {
  tradicional: '🏋️',
  circuito: '🔄',
  hiit: '🔥',
  mobilidade: '🧘',
}

export default function TreinoPage() {
  const router = useRouter()
  const { weekDays, upcomingWorkouts, recentWorkouts, loading } = useWorkouts()
  const { state, getSavedWorkoutId, clearSavedWorkout } = useWorkoutExecution()
  const [selectedDay, setSelectedDay] = useState<DayWorkout | null>(
    weekDays.find(d => format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) || null
  )
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null)

  // Verificar se há treino em andamento
  useEffect(() => {
    const checkSavedWorkout = () => {
      const id = getSavedWorkoutId()
      if (id) {
        setSavedWorkoutId(id)
        setShowResumeModal(true)
      }
    }
    checkSavedWorkout()
  }, [getSavedWorkoutId])

  // Calcular estatísticas da semana
  const weekStats = useMemo(() => {
    const completed = weekDays.filter(d => d.status === 'completed').length
    const total = weekDays.filter(d => d.workout || d.type === 'beach_tennis').length
    return { completed, total }
  }, [weekDays])

  const handleSelectDay = (day: DayWorkout) => {
    setSelectedDay(day)
  }

  // Atualizar selectedDay quando weekDays carregar ou mudar
  useEffect(() => {
    if (weekDays.length > 0) {
      // Sempre buscar o dia atualizado de weekDays
      const currentDateStr = selectedDay ? format(selectedDay.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      const updatedDay = weekDays.find(d => format(d.date, 'yyyy-MM-dd') === currentDateStr)

      // Atualizar se o status ou workout mudou
      if (updatedDay && (!selectedDay ||
          updatedDay.status !== selectedDay.status ||
          updatedDay.workout?.id !== selectedDay.workout?.id)) {
        setSelectedDay(updatedDay)
      } else if (!selectedDay) {
        // Se não tem selectedDay, setar para hoje
        const today = weekDays.find(d => format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
        setSelectedDay(today || null)
      }
    }
  }, [weekDays])

  // Determinar se o dia selecionado é descanso
  const selectedIsRest = selectedDay?.type === 'rest' || selectedDay?.status === 'rest'
  const selectedIsSpecial = selectedDay?.type === 'beach_tennis'
  const selectedIsMissed = selectedDay?.status === 'missed'
  const selectedIsToday = selectedDay && format(selectedDay.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando treinos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Treinos</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/treino/templates"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
              title="Gerenciar treinos"
            >
              <Settings2 className="w-4 h-4" />
              Templates
            </Link>
            <Link
              href="/treino/historico"
              className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
            >
              Histórico
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Week Stats */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Esta semana</p>
                <p className="text-lg font-bold text-white">
                  {weekStats.completed}/{weekStats.total} treinos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-400">
                {weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-500">completado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="px-4 mb-6">
        <WeekCalendar
          days={weekDays}
          onSelectDay={handleSelectDay}
          selectedDate={selectedDay?.date}
        />
      </div>

      {/* Selected Day's Workout */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-400" />
          {selectedIsToday ? 'Hoje' : selectedDay ? format(selectedDay.date, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Hoje'}
        </h2>

        {/* Se é dia de treino perdido, mostrar opção de executar */}
        {selectedIsMissed && selectedDay?.workout ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14141F] border border-red-500/30 rounded-2xl p-5"
          >
            <div className="text-center mb-4">
              <span className="text-4xl mb-3 block">😅</span>
              <h3 className="text-lg font-semibold text-white mb-1">Treino não realizado</h3>
              <p className="text-sm text-slate-400">
                {selectedDay.workout.nome} • {selectedDay.workout.exercicios?.length || 0} exercícios
              </p>
            </div>
            <Link href={`/treino/${selectedDay.workout.id}`}>
              <Button variant="gradient" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Fazer agora
              </Button>
            </Link>
            <p className="text-xs text-slate-500 text-center mt-2">
              O treino será registrado com a data de hoje
            </p>
          </motion.div>
        ) : (
          <TodayWorkoutCard
            workout={selectedDay?.workout || null}
            isRest={selectedIsRest}
            specialActivity={selectedIsSpecial ? { name: 'Beach Tennis', icon: '🎾' } : undefined}
          />
        )}
      </div>

      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-cyan-400" />
            Próximos treinos
          </h2>
          <div className="space-y-3">
            {upcomingWorkouts.map((day, index) => (
              <motion.div
                key={day.date.toISOString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={day.workout ? `/treino/${day.workout.id}` : '#'}>
                  <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {day.icon || typeIcons[day.workout?.tipo || 'tradicional']}
                      </span>
                      <div>
                        <p className="text-white font-medium">
                          {day.workout?.nome || 'Treino'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {format(day.date, "EEEE, d MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="px-4">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            Concluídos recentemente
          </h2>
          <div className="space-y-3">
            {recentWorkouts.map((day, index) => (
              <motion.div
                key={day.date.toISOString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={day.workout ? `/treino/${day.workout.id}` : '#'}>
                  <div className="bg-[#14141F] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-white font-medium">
                          {day.workout?.nome || 'Treino'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {format(day.date, "EEEE, d MMM", { locale: ptBR })} • {day.workout?.duracao_real || day.workout?.duracao_estimada}min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de treino em andamento */}
      <AnimatePresence>
        {showResumeModal && savedWorkoutId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#14141F] rounded-2xl p-6 max-w-sm w-full border border-violet-500/30"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Treino em Andamento</h3>
                <p className="text-slate-400 text-sm">
                  Você tem um treino que não foi finalizado. Deseja continuar de onde parou?
                </p>
                {state.workout && (
                  <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
                    <p className="text-white font-medium">{state.workout.nome}</p>
                    <p className="text-sm text-slate-400">
                      {state.completedSets.length} séries concluídas • {Math.floor(state.elapsedTime / 60)}min
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => {
                    setShowResumeModal(false)
                    router.push(`/treino/${savedWorkoutId}/executar`)
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continuar Treino
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    clearSavedWorkout()
                    setShowResumeModal(false)
                    setSavedWorkoutId(null)
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Descartar e Começar Novo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

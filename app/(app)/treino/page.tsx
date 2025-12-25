"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Calendar, Dumbbell, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { WeekCalendar } from '@/components/treino/week-calendar'
import { TodayWorkoutCard } from '@/components/treino/today-workout-card'
import { useWorkouts } from '@/hooks/use-workouts'
import type { DayWorkout } from '@/lib/workout/types'

const typeIcons: Record<string, string> = {
  tradicional: '🏋️',
  circuito: '🔄',
  hiit: '🔥',
  mobilidade: '🧘',
}

export default function TreinoPage() {
  const { weekDays, todayWorkout, upcomingWorkouts, recentWorkouts, loading } = useWorkouts()
  const [selectedDay, setSelectedDay] = useState<DayWorkout | null>(
    weekDays.find(d => format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) || null
  )

  // Calcular estatísticas da semana
  const weekStats = useMemo(() => {
    const completed = weekDays.filter(d => d.status === 'completed').length
    const total = weekDays.filter(d => d.workout || d.type === 'beach_tennis').length
    return { completed, total }
  }, [weekDays])

  // Verificar se hoje é dia de descanso ou atividade especial
  const todayDay = weekDays.find(d => format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
  const isRestDay = todayDay?.type === 'rest' || todayDay?.status === 'rest'
  const isSpecialActivity = todayDay?.type === 'beach_tennis'

  const handleSelectDay = (day: DayWorkout) => {
    setSelectedDay(day)
  }

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
          <Link
            href="/treino/historico"
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            Histórico
            <ChevronRight className="w-4 h-4" />
          </Link>
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

      {/* Today's Workout */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-400" />
          Hoje
        </h2>
        <TodayWorkoutCard
          workout={todayWorkout}
          isRest={isRestDay}
          specialActivity={isSpecialActivity ? { name: 'Beach Tennis', icon: '🎾' } : undefined}
        />
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
    </div>
  )
}

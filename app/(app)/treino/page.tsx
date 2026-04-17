"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Calendar, Dumbbell, TrendingUp, Loader2, Play, X, Settings2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WeekCalendar } from '@/components/treino/week-calendar'
import { TodayWorkoutCard } from '@/components/treino/today-workout-card'
import { useWorkouts } from '@/hooks/use-workouts'
import { useWorkoutExecution } from '@/hooks/use-workout-execution'
import { Button } from '@/components/ui/button'
import type { DayWorkout } from '@/lib/workout/types'
import type { Activity, ActivityType, IntensityLevel } from '@/lib/activity/types'
import { AddActivityModal } from '@/components/treino/add-activity-modal'
import { ActivityCard } from '@/components/treino/activity-card'

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

  // Estado para atividades extras
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [showAddActivityModal, setShowAddActivityModal] = useState(false)

  // Buscar atividades do dia selecionado
  const fetchActivities = useCallback(async (date: string) => {
    setLoadingActivities(true)
    try {
      const response = await fetch(`/api/activities?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    } finally {
      setLoadingActivities(false)
    }
  }, [])

  // Salvar nova atividade
  const handleSaveActivity = async (activity: {
    activity_type: ActivityType
    custom_name?: string
    duration_minutes: number
    intensity: IntensityLevel
    calories_burned?: number
    distance_km?: number
    notes?: string
    location?: string
    date: string
  }) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      })

      if (response.ok) {
        // Recarregar atividades
        fetchActivities(activity.date)
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error)
    }
  }

  // Deletar atividade
  const handleDeleteActivity = async (id: string) => {
    try {
      const response = await fetch(`/api/activities?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok && selectedDay) {
        fetchActivities(format(selectedDay.date, 'yyyy-MM-dd'))
      }
    } catch (error) {
      console.error('Erro ao deletar atividade:', error)
    }
  }

  // Buscar atividades quando o dia selecionado mudar
  useEffect(() => {
    if (selectedDay) {
      fetchActivities(format(selectedDay.date, 'yyyy-MM-dd'))
    }
  }, [selectedDay, fetchActivities])

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

  // Calcular estatísticas da semana — conta cada treino individualmente (múltiplos por dia incluídos)
  const weekStats = useMemo(() => {
    let completed = 0
    let total = 0
    for (const d of weekDays) {
      const list = d.workouts && d.workouts.length > 0 ? d.workouts : (d.workout ? [d.workout] : [])
      total += list.length
      completed += list.filter(w => w.status === 'concluido').length
      if (list.length === 0 && d.type === 'beach_tennis') total += 1
    }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dourado animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">Carregando treinos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Treinos</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/treino/templates"
              className="flex items-center gap-1 text-sm text-dourado hover:text-dourado/80"
              title="Gerenciar treinos"
            >
              <Settings2 className="w-4 h-4" />
              Templates
            </Link>
            <Link
              href="/treino/historico"
              className="flex items-center gap-1 text-sm text-dourado hover:text-dourado/80"
            >
              Histórico
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <p className="text-foreground-secondary text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Week Stats */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-dourado/10 to-vinho/10 border border-dourado/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dourado/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-dourado" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Esta semana</p>
                <p className="text-lg font-bold text-foreground">
                  {weekStats.completed}/{weekStats.total} treinos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-dourado">
                {weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%
              </p>
              <p className="text-xs text-foreground-muted">completado</p>
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
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-dourado" />
          {selectedIsToday ? 'Hoje' : selectedDay ? format(selectedDay.date, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Hoje'}
        </h2>

        {(() => {
          const dayWorkouts =
            selectedDay?.workouts && selectedDay.workouts.length > 0
              ? selectedDay.workouts
              : selectedDay?.workout
                ? [selectedDay.workout]
                : []

          if (selectedIsMissed && dayWorkouts.length > 0) {
            return (
              <div className="space-y-3">
                {dayWorkouts.length > 1 && (
                  <p className="text-xs text-foreground-muted">
                    {dayWorkouts.length} treinos planejados para este dia
                  </p>
                )}
                {dayWorkouts.map((workout) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-red-500/30 rounded-2xl p-5"
                  >
                    <div className="text-center mb-4">
                      <span className="text-4xl mb-3 block">😅</span>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Treino não realizado</h3>
                      <p className="text-sm text-foreground-secondary">
                        {workout.nome} • {workout.exercicios?.length || 0} exercícios
                      </p>
                    </div>
                    <Link href={`/treino/${workout.id}`}>
                      <Button variant="gradient" className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Fazer agora
                      </Button>
                    </Link>
                    <p className="text-xs text-foreground-muted text-center mt-2">
                      O treino será registrado com a data de hoje
                    </p>
                  </motion.div>
                ))}
              </div>
            )
          }

          if (dayWorkouts.length === 0) {
            return (
              <TodayWorkoutCard
                workout={null}
                isRest={selectedIsRest}
                specialActivity={selectedIsSpecial ? { name: 'Beach Tennis', icon: '🎾' } : undefined}
              />
            )
          }

          return (
            <div className="space-y-3">
              {dayWorkouts.length > 1 && (
                <p className="text-xs text-foreground-muted">
                  {dayWorkouts.length} treinos planejados para este dia
                </p>
              )}
              {dayWorkouts.map((workout) => (
                <TodayWorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )
        })()}
      </div>

      {/* Atividades Extras do Dia */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Atividades do dia
          </h2>
          <button
            onClick={() => setShowAddActivityModal(true)}
            className="flex items-center gap-1 text-sm text-dourado hover:text-dourado/80"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        {loadingActivities ? (
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <Loader2 className="w-5 h-5 text-foreground-secondary animate-spin mx-auto" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                onDelete={handleDeleteActivity}
              />
            ))}
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowAddActivityModal(true)}
            className="w-full bg-white border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-dourado/50 transition-colors"
          >
            <span className="text-3xl mb-2 block">🏃</span>
            <p className="text-foreground-secondary text-sm">
              Fez alguma atividade extra hoje?
            </p>
            <p className="text-dourado text-sm font-medium mt-1">
              Beach tennis, corrida, natação...
            </p>
          </motion.button>
        )}
      </div>

      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-dourado" />
            Próximos treinos
          </h2>
          <div className="space-y-3">
            {upcomingWorkouts.map((day, index) => (
              <motion.div
                key={day.workout?.id ?? `${day.date.toISOString()}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={day.workout ? `/treino/${day.workout.id}` : '#'}>
                  <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between hover:border-dourado/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {day.icon || typeIcons[day.workout?.tipo || 'tradicional']}
                      </span>
                      <div>
                        <p className="text-foreground font-medium">
                          {day.workout?.nome || 'Treino'}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {format(day.date, "EEEE, d MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground-muted" />
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
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
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
                  <div className="bg-white border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-foreground font-medium">
                          {day.workout?.nome || 'Treino'}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {format(day.date, "EEEE, d MMM", { locale: ptBR })} • {day.workout?.duracao_real || day.workout?.duracao_estimada}min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground-muted" />
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
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-dourado/30"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-dourado/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-dourado" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Treino em Andamento</h3>
                <p className="text-foreground-secondary text-sm">
                  Você tem um treino que não foi finalizado. Deseja continuar de onde parou?
                </p>
                {state.workout && (
                  <div className="mt-3 bg-background-elevated/50 rounded-lg p-3">
                    <p className="text-foreground font-medium">{state.workout.nome}</p>
                    <p className="text-sm text-foreground-secondary">
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

      {/* Modal de adicionar atividade */}
      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        onSave={handleSaveActivity}
        date={selectedDay ? format(selectedDay.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  )
}

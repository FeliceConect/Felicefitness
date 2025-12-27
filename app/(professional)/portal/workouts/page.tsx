'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfessional } from '@/hooks/use-professional'
import {
  Dumbbell,
  Search,
  Calendar,
  ArrowLeft,
  Flame,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Timer,
  Weight
} from 'lucide-react'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url: string | null
}

interface WorkoutExercise {
  id: string
  exercise_name: string
  sets_completed: number
  sets_data: Array<{
    reps: number
    weight: number
    completed: boolean
  }>
  notes: string | null
}

interface Workout {
  id: string
  user_id: string
  workout_date: string
  name: string
  status: 'in_progress' | 'completed' | 'skipped'
  duration_minutes: number
  calories_burned: number
  total_volume: number
  total_sets: number
  total_reps: number
  exercises_count: number
  muscle_groups: string[]
  prs: Array<{
    exercise: string
    type: string
    value: number
    previous: number
  }>
  notes: string | null
  rating: number | null
  perceived_effort: number | null
  profile?: {
    id: string
    nome: string
    email: string
    avatar_url: string | null
  }
  exercises?: WorkoutExercise[]
}

interface Stats {
  totalWorkouts: number
  completedWorkouts: number
  totalDuration: number
  totalCalories: number
  totalVolume: number
  avgDuration: number
  workoutsPerClient: Record<string, number>
  prsCount: number
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'completed': { label: 'Concluido', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  'in_progress': { label: 'Em andamento', color: 'text-yellow-400', icon: <Timer className="w-4 h-4" /> },
  'skipped': { label: 'Pulado', color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> }
}

export default function PortalWorkoutsPage() {
  const router = useRouter()
  const { professional, loading: profLoading } = useProfessional()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'custom'>('14d')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Expandir detalhes
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profLoading && professional) {
      fetchWorkouts()
    }
  }, [profLoading, professional, selectedClient, selectedStatus, dateRange, startDate, endDate])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (selectedClient) {
        params.append('clientId', selectedClient)
      }

      if (selectedStatus) {
        params.append('status', selectedStatus)
      }

      if (dateRange === 'custom' && startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      } else {
        const today = new Date()
        const start = new Date()

        switch (dateRange) {
          case '7d':
            start.setDate(today.getDate() - 7)
            break
          case '14d':
            start.setDate(today.getDate() - 14)
            break
          case '30d':
            start.setDate(today.getDate() - 30)
            break
        }

        params.append('startDate', start.toISOString().split('T')[0])
        params.append('endDate', today.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/portal/client-workouts?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setWorkouts(data.workouts || [])
        setClients(data.clients || [])
        setStats(data.stats || null)
      } else {
        setError(data.error || 'Erro ao carregar treinos')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar treinos')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkoutExpanded = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId)
    } else {
      newExpanded.add(workoutId)
    }
    setExpandedWorkouts(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return '0min'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const formatVolume = (volume: number) => {
    if (!volume) return '0 kg'
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}t`
    }
    return `${volume.toLocaleString()} kg`
  }

  // Filtrar por busca
  const filteredWorkouts = workouts.filter(workout => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      workout.name?.toLowerCase().includes(term) ||
      workout.profile?.nome?.toLowerCase().includes(term) ||
      workout.muscle_groups?.some(mg => mg.toLowerCase().includes(term))
    )
  })

  // Agrupar por data
  const groupedWorkouts: Record<string, Workout[]> = {}
  filteredWorkouts.forEach(workout => {
    const date = workout.workout_date
    if (!groupedWorkouts[date]) {
      groupedWorkouts[date] = []
    }
    groupedWorkouts[date].push(workout)
  })

  // Ordenar datas (mais recente primeiro)
  const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => b.localeCompare(a))

  if (profLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Acesso restrito a profissionais</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/portal')}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-violet-500" />
                Treinos dos Clientes
              </h1>
              <p className="text-sm text-gray-400">
                {filteredWorkouts.length} treinos encontrados
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-4 pb-4 space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou grupo muscular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Cliente */}
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500 min-w-[140px]"
            >
              <option value="">Todos os clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500 min-w-[120px]"
            >
              <option value="">Todos status</option>
              <option value="completed">Concluidos</option>
              <option value="in_progress">Em andamento</option>
              <option value="skipped">Pulados</option>
            </select>

            {/* Periodo */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '14d' | '30d' | 'custom')}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500 min-w-[120px]"
            >
              <option value="7d">7 dias</option>
              <option value="14d">14 dias</option>
              <option value="30d">30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Datas personalizadas */}
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Concluidos</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedWorkouts}</p>
              <p className="text-xs text-gray-500">de {stats.totalWorkouts} treinos</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Tempo Total</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
              <p className="text-xs text-gray-500">media {stats.avgDuration}min</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xs">Calorias</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs">PRs</span>
              </div>
              <p className="text-2xl font-bold">{stats.prsCount}</p>
              <p className="text-xs text-gray-500">recordes pessoais</p>
            </div>
          </div>

          {/* Volume total */}
          <div className="mt-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl p-4 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-400">
                <Weight className="w-4 h-4" />
                <span className="text-sm">Volume Total</span>
              </div>
              <p className="text-2xl font-bold">{formatVolume(stats.totalVolume)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchWorkouts}
              className="mt-4 px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">Nenhum treino encontrado</h3>
            <p className="text-gray-500 mt-2">
              Ajuste os filtros ou aguarde seus clientes registrarem treinos
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                {/* Header do dia */}
                <div className="sticky top-[140px] bg-gray-950/95 backdrop-blur-sm py-2 z-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <span className="font-semibold text-violet-400">{formatDate(date)}</span>
                    <span className="text-gray-500 text-sm">
                      ({groupedWorkouts[date].length} treinos)
                    </span>
                  </div>
                </div>

                {/* Treinos do dia */}
                <div className="space-y-3 mt-2">
                  {groupedWorkouts[date].map(workout => {
                    const statusInfo = statusLabels[workout.status] || statusLabels['completed']

                    return (
                      <div
                        key={workout.id}
                        className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
                      >
                        {/* Header do treino */}
                        <button
                          onClick={() => toggleWorkoutExpanded(workout.id)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Avatar do cliente */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                            {workout.profile?.nome?.charAt(0) || 'C'}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{workout.profile?.nome || 'Cliente'}</span>
                              <span className={`flex items-center gap-1 text-sm ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="font-medium text-white">{workout.name || 'Treino'}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(workout.duration_minutes)}
                              </span>
                              {workout.prs && workout.prs.length > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <Trophy className="w-3 h-3" />
                                  {workout.prs.length} PR
                                </span>
                              )}
                            </div>
                          </div>

                          {expandedWorkouts.has(workout.id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                        </button>

                        {/* Detalhes expandidos */}
                        {expandedWorkouts.has(workout.id) && (
                          <div className="px-4 pb-4 border-t border-gray-800">
                            {/* Grupos musculares */}
                            {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {workout.muscle_groups.map((mg, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-violet-500/20 text-violet-300 rounded-full"
                                  >
                                    {mg}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Stats do treino */}
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Duracao</p>
                                <p className="text-lg font-bold text-blue-400">{formatDuration(workout.duration_minutes)}</p>
                              </div>
                              <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Calorias</p>
                                <p className="text-lg font-bold text-orange-400">{workout.calories_burned || 0}</p>
                              </div>
                              <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Series</p>
                                <p className="text-lg font-bold text-green-400">{workout.total_sets || 0}</p>
                              </div>
                              <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">Volume</p>
                                <p className="text-lg font-bold text-violet-400">{formatVolume(workout.total_volume)}</p>
                              </div>
                            </div>

                            {/* PRs */}
                            {workout.prs && workout.prs.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                                  <Trophy className="w-4 h-4" />
                                  Recordes Pessoais
                                </h4>
                                <div className="space-y-2">
                                  {workout.prs.map((pr, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2"
                                    >
                                      <div>
                                        <p className="font-medium text-yellow-300">{pr.exercise}</p>
                                        <p className="text-xs text-gray-500">{pr.type}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-yellow-400">{pr.value} kg</p>
                                        <p className="text-xs text-gray-500">anterior: {pr.previous} kg</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercicios */}
                            {workout.exercises && workout.exercises.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Exercicios</h4>
                                <div className="space-y-2">
                                  {workout.exercises.map((exercise, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-800/50 rounded-lg px-3 py-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <p className="font-medium">{exercise.exercise_name}</p>
                                        <p className="text-sm text-gray-400">
                                          {exercise.sets_completed} series
                                        </p>
                                      </div>
                                      {exercise.sets_data && exercise.sets_data.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                          {exercise.sets_data.map((set, setIdx) => (
                                            <span
                                              key={setIdx}
                                              className={`text-xs px-2 py-1 rounded ${
                                                set.completed
                                                  ? 'bg-green-500/20 text-green-300'
                                                  : 'bg-gray-700 text-gray-400'
                                              }`}
                                            >
                                              {set.weight}kg x {set.reps}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Esforco e avaliacao */}
                            <div className="mt-4 flex gap-4">
                              {workout.perceived_effort && (
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-red-400" />
                                  <span className="text-sm text-gray-400">
                                    Esforco: <span className="text-white font-medium">{workout.perceived_effort}/10</span>
                                  </span>
                                </div>
                              )}
                              {workout.rating && (
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm text-gray-400">
                                    Avaliacao: <span className="text-white font-medium">{workout.rating}/5</span>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Notas */}
                            {workout.notes && (
                              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-400 mb-1">Observacoes</h4>
                                <p className="text-sm text-gray-300">{workout.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

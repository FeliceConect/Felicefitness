"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Utensils,
  Dumbbell,
  Droplets,
  Scale,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Activity,
  MessageSquare,
  Trophy,
  Moon
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import { AwardPointsModal } from '@/components/portal/points/award-points-modal'
import {
  TabProntuario,
  TabBioimpedancia,
  TabAntropometria,
  TabPlanoAlimentar,
  TabFormularios,
} from '@/components/portal/client-detail'

interface ClientDetails {
  id: string
  nome: string | null
  email: string | null
  foto: string | null
  peso: number | null
  altura: number | null
  objetivo: string | null
  meta_calorias: number | null
  meta_proteinas: number | null
  meta_carboidratos: number | null
  meta_gorduras: number | null
  meta_agua: number | null
  data_nascimento: string | null
  genero: string | null
  nivel_atividade: string | null
  updated_at: string | null
}

interface WeekStats {
  nutrition: {
    meals: number
    daysWithMeals: number
    avgDailyCalories: number
    avgDailyProtein: number
    avgDailyCarbs: number
    avgDailyFat: number
  }
  training: {
    workouts: number
    workoutDays: number
    totalMinutes: number
    caloriesBurned: number
  }
  hydration: {
    records: number
    avgDaily: number
    goalMl?: number
    daysGoalMet?: number
    dailyLog?: Array<{ date: string; ml: number }>
  }
  sleep: {
    records: number
    avgHours: number | string
    avgQuality?: number | string
    dailyLog?: Array<{ date: string; hours: number; quality: number; bedtime?: string; wakeup?: string }>
  }
  weight: {
    current: number | null
    change: number | string
    history: Array<{ date: string; weight: number }>
  }
}

interface Meal {
  id: string
  tipo: string
  descricao: string | null
  calorias: number | null
  proteinas: number | null
  carboidratos: number | null
  gorduras: number | null
  foto: string | null
  data: string
  hora: string | null
}

interface Workout {
  id: string
  nome: string
  tipo: string | null
  duracao: number | null
  calorias_queimadas: number | null
  data: string
}

interface Bioimpedance {
  data: string
  peso: number | null
  massa_muscular: number | null
  gordura_corporal: number | null
  agua_corporal: number | null
  massa_ossea: number | null
  metabolismo_basal: number | null
}

type TabKey = 'overview' | 'meals' | 'workouts' | 'hydration' | 'sleep' | 'prontuario' | 'bioimpedancia' | 'antropometria' | 'plano-alimentar' | 'formularios'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { professional, isNutritionist, isTrainer, isCoach, isPhysiotherapist } = useProfessional()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [recentMeals, setRecentMeals] = useState<Meal[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [bioimpedance, setBioimpedance] = useState<Bioimpedance | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [showPointsModal, setShowPointsModal] = useState(false)

  // Determine permissions for edit
  const canEditAntropometria = isNutritionist || isTrainer // admin/superadmin handled separately

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/professional/clients/${params.id}`)
        const data = await response.json()

        if (data.success) {
          setClient(data.client)
          setWeekStats(data.weekStats)
          setRecentMeals(data.recentMeals || [])
          setRecentWorkouts(data.recentWorkouts || [])
          setBioimpedance(data.bioimpedance)
        } else {
          router.push('/portal/clients')
        }
      } catch (error) {
        console.error('Erro ao buscar cliente:', error)
        router.push('/portal/clients')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClient()
    }
  }, [params.id, router])

  const handleAwardPoints = async (points: number, reason: string) => {
    const res = await fetch('/api/portal/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: params.id, points, reason }),
    })
    const data = await res.json()
    if (data.success) {
      setShowPointsModal(false)
      alert(`${points} pontos atribuidos!`)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getActivityLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      sedentario: 'Sedentário',
      leve: 'Levemente ativo',
      moderado: 'Moderadamente ativo',
      ativo: 'Muito ativo',
      muito_ativo: 'Extremamente ativo'
    }
    return levels[level] || level
  }

  const getMealTypeLabel = (tipo: string) => {
    const types: Record<string, string> = {
      cafe: 'Café da manhã',
      almoco: 'Almoço',
      jantar: 'Jantar',
      lanche: 'Lanche',
      ceia: 'Ceia'
    }
    return types[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  // Build tabs based on professional type
  const tabs: Array<{ key: TabKey; label: string; show: boolean }> = [
    { key: 'overview', label: 'Visão Geral', show: true },
    { key: 'meals', label: 'Refeições', show: isNutritionist },
    { key: 'workouts', label: 'Treinos', show: isTrainer },
    { key: 'hydration', label: 'Hidratação', show: true },
    { key: 'sleep', label: 'Sono', show: true },
    { key: 'prontuario', label: 'Prontuário', show: true },
    { key: 'bioimpedancia', label: 'Bioimpedância', show: !isCoach && !isPhysiotherapist },
    { key: 'antropometria', label: 'Antropometria', show: !isCoach && !isPhysiotherapist },
    { key: 'plano-alimentar', label: 'Plano Alimentar', show: isNutritionist },
    { key: 'formularios', label: 'Formulários', show: true },
  ]

  const visibleTabs = tabs.filter(t => t.show)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal/clients"
          className="p-2 rounded-lg bg-white border border-border hover:bg-background-elevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{client.nome || 'Cliente'}</h1>
          <p className="text-foreground-secondary">{client.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPointsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg transition-colors"
          >
            <Trophy className="w-5 h-5" />
            <span className="hidden sm:inline">Pontos</span>
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/chat/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clientId: client.id })
                })
                const data = await response.json()
                if (data.success) {
                  router.push('/portal/messages')
                }
              } catch (error) {
                console.error('Erro ao iniciar conversa:', error)
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vinho hover:bg-vinho/90 text-white rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">Mensagem</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-dourado/10 flex items-center justify-center overflow-hidden">
              {client.foto ? (
                <img src={client.foto} alt={client.nome || ''} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-dourado" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                {client.data_nascimento && (
                  <span>{calculateAge(client.data_nascimento)} anos</span>
                )}
                {client.genero && (
                  <span>| {client.genero === 'masculino' ? 'Masculino' : 'Feminino'}</span>
                )}
              </div>
              {client.objetivo && (
                <div className="flex items-center gap-2 mt-2">
                  <Target className="w-4 h-4 text-dourado" />
                  <span className="text-foreground">{client.objetivo}</span>
                </div>
              )}
              {client.nivel_atividade && (
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-secondary">
                    {getActivityLevelLabel(client.nivel_atividade)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <Scale className="w-5 h-5 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold text-foreground">{client.peso || '-'} kg</p>
              <p className="text-xs text-foreground-muted">Peso</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <User className="w-5 h-5 mx-auto text-purple-400 mb-1" />
              <p className="text-lg font-bold text-foreground">{client.altura || '-'} cm</p>
              <p className="text-xs text-foreground-muted">Altura</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <Utensils className="w-5 h-5 mx-auto text-green-400 mb-1" />
              <p className="text-lg font-bold text-foreground">{client.meta_calorias || '-'}</p>
              <p className="text-xs text-foreground-muted">Meta kcal</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <Droplets className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <p className="text-lg font-bold text-foreground">{client.meta_agua || '-'} ml</p>
              <p className="text-xs text-foreground-muted">Meta água</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nutrition */}
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-green-400" />
            <h3 className="text-foreground font-medium">Nutrição (7 dias)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Refeições</span>
              <span className="text-foreground">{weekStats?.nutrition.meals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Média kcal/dia</span>
              <span className="text-foreground">{weekStats?.nutrition.avgDailyCalories || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Média prot/dia</span>
              <span className="text-foreground">{weekStats?.nutrition.avgDailyProtein || 0}g</span>
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            <h3 className="text-foreground font-medium">Treinos (7 dias)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Treinos</span>
              <span className="text-foreground">{weekStats?.training.workouts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Dias treinando</span>
              <span className="text-foreground">{weekStats?.training.workoutDays || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Total minutos</span>
              <span className="text-foreground">{weekStats?.training.totalMinutes || 0}</span>
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <h3 className="text-foreground font-medium">Hidratação</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Média/dia</span>
              <span className="text-foreground">{weekStats?.hydration.avgDaily || 0} ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Meta</span>
              <span className="text-foreground">{client.meta_agua || 2000} ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">% da meta</span>
              <span className={`${
                (weekStats?.hydration.avgDaily || 0) >= (client.meta_agua || 2000)
                  ? 'text-green-400'
                  : 'text-amber-400'
              }`}>
                {client.meta_agua
                  ? Math.round(((weekStats?.hydration.avgDaily || 0) / client.meta_agua) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-blue-400" />
            <h3 className="text-foreground font-medium">Peso</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Atual</span>
              <span className="text-foreground">{weekStats?.weight.current || '-'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">Variação (30d)</span>
              <span className={`flex items-center gap-1 ${
                Number(weekStats?.weight.change) > 0
                  ? 'text-red-400'
                  : Number(weekStats?.weight.change) < 0
                  ? 'text-green-400'
                  : 'text-foreground-secondary'
              }`}>
                {Number(weekStats?.weight.change) > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : Number(weekStats?.weight.change) < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                {weekStats?.weight.change || 0} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bioimpedance Summary */}
      {bioimpedance && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-dourado" />
            Última Bioimpedância ({formatDate(bioimpedance.data)})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-foreground">{bioimpedance.peso || '-'}</p>
              <p className="text-xs text-foreground-muted">Peso (kg)</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-blue-400">{bioimpedance.massa_muscular || '-'}</p>
              <p className="text-xs text-foreground-muted">Massa Muscular (kg)</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-amber-400">{bioimpedance.gordura_corporal || '-'}%</p>
              <p className="text-xs text-foreground-muted">Gordura Corporal</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-cyan-400">{bioimpedance.agua_corporal || '-'}%</p>
              <p className="text-xs text-foreground-muted">Água Corporal</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-purple-400">{bioimpedance.massa_ossea || '-'}</p>
              <p className="text-xs text-foreground-muted">Massa Óssea (kg)</p>
            </div>
            <div className="text-center p-3 bg-background-elevated rounded-lg">
              <p className="text-xl font-bold text-green-400">{bioimpedance.metabolismo_basal || '-'}</p>
              <p className="text-xs text-foreground-muted">TMB (kcal)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-1 border-b border-border min-w-max">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-dourado border-b-2 border-dourado'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Meals */}
          <div className="bg-white rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-400" />
                Últimas Refeições
              </h3>
            </div>
            <div className="p-4">
              {recentMeals.length === 0 ? (
                <p className="text-center text-foreground-secondary py-4">Nenhuma refeição registrada</p>
              ) : (
                <div className="space-y-3">
                  {recentMeals.slice(0, 5).map((meal) => (
                    <div key={meal.id} className="p-3 bg-background-elevated rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground font-medium">{getMealTypeLabel(meal.tipo)}</span>
                        <span className="text-xs text-foreground-muted">{formatDate(meal.data)}</span>
                      </div>
                      {meal.descricao && (
                        <p className="text-sm text-foreground-secondary truncate">{meal.descricao}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-green-400">{meal.calorias || 0} kcal</span>
                        <span className="text-blue-400">{meal.proteinas || 0}g P</span>
                        <span className="text-amber-400">{meal.carboidratos || 0}g C</span>
                        <span className="text-red-400">{meal.gorduras || 0}g G</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Workouts */}
          <div className="bg-white rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                Últimos Treinos
              </h3>
            </div>
            <div className="p-4">
              {recentWorkouts.length === 0 ? (
                <p className="text-center text-foreground-secondary py-4">Nenhum treino registrado</p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.slice(0, 5).map((workout) => (
                    <div key={workout.id} className="p-3 bg-background-elevated rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground font-medium">{workout.nome}</span>
                        <span className="text-xs text-foreground-muted">{formatDate(workout.data)}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-foreground-secondary">
                        {workout.duracao && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.duracao} min
                          </span>
                        )}
                        {workout.calorias_queimadas && (
                          <span className="text-orange-400">
                            {workout.calorias_queimadas} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'meals' && (
        <div className="bg-white rounded-xl border border-border p-4">
          {recentMeals.length === 0 ? (
            <p className="text-center text-foreground-secondary py-8">Nenhuma refeição registrada nos últimos 7 dias</p>
          ) : (
            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="p-4 bg-background-elevated rounded-lg flex gap-4">
                  {meal.foto && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={meal.foto} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-foreground font-medium">{getMealTypeLabel(meal.tipo)}</span>
                      <span className="text-sm text-foreground-secondary">
                        {formatDate(meal.data)} {meal.hora}
                      </span>
                    </div>
                    {meal.descricao && (
                      <p className="text-sm text-foreground-secondary mb-2">{meal.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded">
                        {meal.calorias || 0} kcal
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded">
                        {meal.proteinas || 0}g Proteína
                      </span>
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-600 rounded">
                        {meal.carboidratos || 0}g Carboidrato
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded">
                        {meal.gorduras || 0}g Gordura
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="bg-white rounded-xl border border-border p-4">
          {recentWorkouts.length === 0 ? (
            <p className="text-center text-foreground-secondary py-8">Nenhum treino registrado nos últimos 7 dias</p>
          ) : (
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="p-4 bg-background-elevated rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg text-foreground font-medium">{workout.nome}</span>
                    <span className="text-sm text-foreground-secondary flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(workout.data)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {workout.tipo && (
                      <span className="px-2 py-1 bg-dourado/20 text-dourado rounded">
                        {workout.tipo}
                      </span>
                    )}
                    {workout.duracao && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workout.duracao} min
                      </span>
                    )}
                    {workout.calorias_queimadas && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-600 rounded">
                        {workout.calorias_queimadas} kcal queimadas
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hydration' && weekStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.hydration.avgDaily || 0}</p>
              <p className="text-xs text-foreground-muted">Média diária (ml)</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.hydration.goalMl || 2500}</p>
              <p className="text-xs text-foreground-muted">Meta (ml)</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.hydration.daysGoalMet || 0}/7</p>
              <p className="text-xs text-foreground-muted">Dias meta atingida</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Activity className="w-6 h-6 text-dourado mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.hydration.records || 0}</p>
              <p className="text-xs text-foreground-muted">Registros na semana</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                Registro Diário
              </h3>
            </div>
            <div className="p-4">
              {(!weekStats.hydration.dailyLog || weekStats.hydration.dailyLog.length === 0) ? (
                <p className="text-center text-foreground-secondary py-4">Nenhum registro de hidratação nos últimos 7 dias</p>
              ) : (
                <div className="space-y-3">
                  {weekStats.hydration.dailyLog.map((entry) => {
                    const goalMl = weekStats.hydration.goalMl || 2500
                    const percentage = Math.min(Math.round((entry.ml / goalMl) * 100), 100)
                    const metGoal = entry.ml >= goalMl
                    return (
                      <div key={entry.date} className="p-3 bg-background-elevated rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-foreground font-medium">{formatDate(entry.date)}</span>
                          <span className={`text-sm font-medium ${metGoal ? 'text-green-400' : 'text-amber-400'}`}>
                            {entry.ml} ml {metGoal ? '✓' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${metGoal ? 'bg-green-400' : 'bg-blue-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">{percentage}% da meta</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sleep' && weekStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Moon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.sleep.avgHours || 0}h</p>
              <p className="text-xs text-foreground-muted">Média de sono</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Activity className="w-6 h-6 text-dourado mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.sleep.avgQuality || 0}/5</p>
              <p className="text-xs text-foreground-muted">Qualidade média</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{weekStats.sleep.records || 0}</p>
              <p className="text-xs text-foreground-muted">Registros na semana</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                Registro Diário de Sono
              </h3>
            </div>
            <div className="p-4">
              {(!weekStats.sleep.dailyLog || weekStats.sleep.dailyLog.length === 0) ? (
                <p className="text-center text-foreground-secondary py-4">Nenhum registro de sono nos últimos 7 dias</p>
              ) : (
                <div className="space-y-3">
                  {weekStats.sleep.dailyLog.map((entry) => {
                    const qualityColor = entry.quality >= 4 ? 'text-green-400'
                      : entry.quality >= 3 ? 'text-amber-400'
                      : 'text-red-400'
                    const hoursColor = entry.hours >= 7 ? 'text-green-400'
                      : entry.hours >= 6 ? 'text-amber-400'
                      : 'text-red-400'
                    return (
                      <div key={entry.date} className="p-3 bg-background-elevated rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-foreground font-medium">{formatDate(entry.date)}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${hoursColor}`}>
                              {entry.hours.toFixed(1)}h
                            </span>
                            <span className={`text-sm font-medium ${qualityColor}`}>
                              {'★'.repeat(Math.round(entry.quality))}{'☆'.repeat(5 - Math.round(entry.quality))}
                            </span>
                          </div>
                        </div>
                        {(entry.bedtime || entry.wakeup) && (
                          <div className="flex gap-4 text-xs text-foreground-muted mt-1">
                            {entry.bedtime && <span>Dormiu: {entry.bedtime}</span>}
                            {entry.wakeup && <span>Acordou: {entry.wakeup}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prontuario' && (
        <TabProntuario patientId={params.id as string} professionalType={professional?.type} />
      )}

      {activeTab === 'bioimpedancia' && (
        <TabBioimpedancia patientId={params.id as string} />
      )}

      {activeTab === 'antropometria' && (
        <TabAntropometria patientId={params.id as string} canEdit={canEditAntropometria} />
      )}

      {activeTab === 'plano-alimentar' && (
        <TabPlanoAlimentar patientId={params.id as string} />
      )}

      {activeTab === 'formularios' && (
        <TabFormularios patientId={params.id as string} />
      )}

      {/* Award Points Modal */}
      <AwardPointsModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onAward={handleAwardPoints}
        clientName={client.nome || 'Cliente'}
      />
    </div>
  )
}

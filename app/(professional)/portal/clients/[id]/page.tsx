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
  FileText,
  Trophy,
  Plus,
  Moon
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import { NoteCard } from '@/components/portal/notes/note-card'
import type { Note } from '@/components/portal/notes/note-card'
import { NoteEditor } from '@/components/portal/notes/note-editor'
import { AwardPointsModal } from '@/components/portal/points/award-points-modal'

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

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isNutritionist, isTrainer } = useProfessional()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [recentMeals, setRecentMeals] = useState<Meal[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [bioimpedance, setBioimpedance] = useState<Bioimpedance | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'workouts' | 'hydration' | 'sleep' | 'notes'>('overview')
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<{ note_type: string; content: string; id?: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [showPointsModal, setShowPointsModal] = useState(false)

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

  // Fetch notes when tab switches
  useEffect(() => {
    if (activeTab === 'notes' && params.id) {
      setLoadingNotes(true)
      fetch(`/api/portal/notes?patientId=${params.id}`)
        .then(r => r.json())
        .then(data => { if (data.success) setNotes(data.notes || []) })
        .catch(console.error)
        .finally(() => setLoadingNotes(false))
    }
  }, [activeTab, params.id])

  const handleSaveNote = async (data: { note_type: string; content: string }) => {
    setSavingNote(true)
    try {
      if (editingNote?.id) {
        const res = await fetch(`/api/portal/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if ((await res.json()).success) {
          setShowNoteEditor(false)
          setEditingNote(null)
          // Refetch
          const r2 = await fetch(`/api/portal/notes?patientId=${params.id}`)
          const d2 = await r2.json()
          if (d2.success) setNotes(d2.notes || [])
        }
      } else {
        const res = await fetch('/api/portal/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: params.id, ...data }),
        })
        if ((await res.json()).success) {
          setShowNoteEditor(false)
          const r2 = await fetch(`/api/portal/notes?patientId=${params.id}`)
          const d2 = await r2.json()
          if (d2.success) setNotes(d2.notes || [])
        }
      }
    } catch (error) { console.error('Erro ao salvar nota:', error) }
    finally { setSavingNote(false) }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Remover esta nota?')) return
    try {
      await fetch(`/api/portal/notes/${id}`, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (error) { console.error(error) }
  }

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal/clients"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{client.nome || 'Cliente'}</h1>
          <p className="text-slate-400">{client.email}</p>
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center overflow-hidden">
              {client.foto ? (
                <img src={client.foto} alt={client.nome || ''} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-violet-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                {client.data_nascimento && (
                  <span>{calculateAge(client.data_nascimento)} anos</span>
                )}
                {client.genero && (
                  <span>| {client.genero === 'masculino' ? 'Masculino' : 'Feminino'}</span>
                )}
              </div>
              {client.objetivo && (
                <div className="flex items-center gap-2 mt-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <span className="text-white">{client.objetivo}</span>
                </div>
              )}
              {client.nivel_atividade && (
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {getActivityLevelLabel(client.nivel_atividade)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <Scale className="w-5 h-5 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold text-white">{client.peso || '-'} kg</p>
              <p className="text-xs text-slate-400">Peso</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <User className="w-5 h-5 mx-auto text-purple-400 mb-1" />
              <p className="text-lg font-bold text-white">{client.altura || '-'} cm</p>
              <p className="text-xs text-slate-400">Altura</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <Utensils className="w-5 h-5 mx-auto text-green-400 mb-1" />
              <p className="text-lg font-bold text-white">{client.meta_calorias || '-'}</p>
              <p className="text-xs text-slate-400">Meta kcal</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <Droplets className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <p className="text-lg font-bold text-white">{client.meta_agua || '-'} ml</p>
              <p className="text-xs text-slate-400">Meta água</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nutrition */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-medium">Nutrição (7 dias)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Refeições</span>
              <span className="text-white">{weekStats?.nutrition.meals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Média kcal/dia</span>
              <span className="text-white">{weekStats?.nutrition.avgDailyCalories || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Média prot/dia</span>
              <span className="text-white">{weekStats?.nutrition.avgDailyProtein || 0}g</span>
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-medium">Treinos (7 dias)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Treinos</span>
              <span className="text-white">{weekStats?.training.workouts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dias treinando</span>
              <span className="text-white">{weekStats?.training.workoutDays || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total minutos</span>
              <span className="text-white">{weekStats?.training.totalMinutes || 0}</span>
            </div>
          </div>
        </div>

        {/* Hydration & Sleep */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">Hidratação</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Média/dia</span>
              <span className="text-white">{weekStats?.hydration.avgDaily || 0} ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Meta</span>
              <span className="text-white">{client.meta_agua || 2000} ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">% da meta</span>
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
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-medium">Peso</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Atual</span>
              <span className="text-white">{weekStats?.weight.current || '-'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Variação (30d)</span>
              <span className={`flex items-center gap-1 ${
                Number(weekStats?.weight.change) > 0
                  ? 'text-red-400'
                  : Number(weekStats?.weight.change) < 0
                  ? 'text-green-400'
                  : 'text-slate-400'
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

      {/* Bioimpedance */}
      {bioimpedance && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Última Bioimpedância ({formatDate(bioimpedance.data)})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-white">{bioimpedance.peso || '-'}</p>
              <p className="text-xs text-slate-400">Peso (kg)</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-blue-400">{bioimpedance.massa_muscular || '-'}</p>
              <p className="text-xs text-slate-400">Massa Muscular (kg)</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-amber-400">{bioimpedance.gordura_corporal || '-'}%</p>
              <p className="text-xs text-slate-400">Gordura Corporal</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-cyan-400">{bioimpedance.agua_corporal || '-'}%</p>
              <p className="text-xs text-slate-400">Água Corporal</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-purple-400">{bioimpedance.massa_ossea || '-'}</p>
              <p className="text-xs text-slate-400">Massa Óssea (kg)</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xl font-bold text-green-400">{bioimpedance.metabolismo_basal || '-'}</p>
              <p className="text-xs text-slate-400">TMB (kcal)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Visão Geral
        </button>
        {isNutritionist && (
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'meals'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Refeições
          </button>
        )}
        {isTrainer && (
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Treinos
          </button>
        )}
        <button
          onClick={() => setActiveTab('hydration')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'hydration'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hidratação
        </button>
        <button
          onClick={() => setActiveTab('sleep')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sleep'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sono
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'notes'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Notas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Meals */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-400" />
                Últimas Refeições
              </h3>
            </div>
            <div className="p-4">
              {recentMeals.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Nenhuma refeição registrada</p>
              ) : (
                <div className="space-y-3">
                  {recentMeals.slice(0, 5).map((meal) => (
                    <div key={meal.id} className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{getMealTypeLabel(meal.tipo)}</span>
                        <span className="text-xs text-slate-400">{formatDate(meal.data)}</span>
                      </div>
                      {meal.descricao && (
                        <p className="text-sm text-slate-400 truncate">{meal.descricao}</p>
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
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                Últimos Treinos
              </h3>
            </div>
            <div className="p-4">
              {recentWorkouts.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Nenhum treino registrado</p>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.slice(0, 5).map((workout) => (
                    <div key={workout.id} className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{workout.nome}</span>
                        <span className="text-xs text-slate-400">{formatDate(workout.data)}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-400">
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
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          {recentMeals.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhuma refeição registrada nos últimos 7 dias</p>
          ) : (
            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="p-4 bg-slate-700/30 rounded-lg flex gap-4">
                  {meal.foto && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={meal.foto} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{getMealTypeLabel(meal.tipo)}</span>
                      <span className="text-sm text-slate-400">
                        {formatDate(meal.data)} {meal.hora}
                      </span>
                    </div>
                    {meal.descricao && (
                      <p className="text-sm text-slate-300 mb-2">{meal.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        {meal.calorias || 0} kcal
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        {meal.proteinas || 0}g Proteína
                      </span>
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                        {meal.carboidratos || 0}g Carboidrato
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
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
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          {recentWorkouts.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhum treino registrado nos últimos 7 dias</p>
          ) : (
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg text-white font-medium">{workout.nome}</span>
                    <span className="text-sm text-slate-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(workout.data)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {workout.tipo && (
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                        {workout.tipo}
                      </span>
                    )}
                    {workout.duracao && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workout.duracao} min
                      </span>
                    )}
                    {workout.calorias_queimadas && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.hydration.avgDaily || 0}</p>
              <p className="text-xs text-slate-400">Média diária (ml)</p>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.hydration.goalMl || 2500}</p>
              <p className="text-xs text-slate-400">Meta (ml)</p>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.hydration.daysGoalMet || 0}/7</p>
              <p className="text-xs text-slate-400">Dias meta atingida</p>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Activity className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.hydration.records || 0}</p>
              <p className="text-xs text-slate-400">Registros na semana</p>
            </div>
          </div>

          {/* Daily Log */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                Registro Diário
              </h3>
            </div>
            <div className="p-4">
              {(!weekStats.hydration.dailyLog || weekStats.hydration.dailyLog.length === 0) ? (
                <p className="text-center text-slate-400 py-4">Nenhum registro de hidratação nos últimos 7 dias</p>
              ) : (
                <div className="space-y-3">
                  {weekStats.hydration.dailyLog.map((entry) => {
                    const goalMl = weekStats.hydration.goalMl || 2500
                    const percentage = Math.min(Math.round((entry.ml / goalMl) * 100), 100)
                    const metGoal = entry.ml >= goalMl
                    return (
                      <div key={entry.date} className="p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{formatDate(entry.date)}</span>
                          <span className={`text-sm font-medium ${metGoal ? 'text-green-400' : 'text-amber-400'}`}>
                            {entry.ml} ml {metGoal ? '✓' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${metGoal ? 'bg-green-400' : 'bg-blue-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{percentage}% da meta</p>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Moon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.sleep.avgHours || 0}h</p>
              <p className="text-xs text-slate-400">Média de sono</p>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Activity className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.sleep.avgQuality || 0}/5</p>
              <p className="text-xs text-slate-400">Qualidade média</p>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{weekStats.sleep.records || 0}</p>
              <p className="text-xs text-slate-400">Registros na semana</p>
            </div>
          </div>

          {/* Daily Log */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                Registro Diário de Sono
              </h3>
            </div>
            <div className="p-4">
              {(!weekStats.sleep.dailyLog || weekStats.sleep.dailyLog.length === 0) ? (
                <p className="text-center text-slate-400 py-4">Nenhum registro de sono nos últimos 7 dias</p>
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
                      <div key={entry.date} className="p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{formatDate(entry.date)}</span>
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
                          <div className="flex gap-4 text-xs text-slate-400 mt-1">
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

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingNote(null); setShowNoteEditor(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Nota
            </button>
          </div>
          {loadingNotes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 h-28 animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
              <p className="text-foreground-secondary text-sm">Nenhuma nota para este paciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(n: { id: string; note_type: string; content: string }) => {
                    setEditingNote({ id: n.id, note_type: n.note_type, content: n.content })
                    setShowNoteEditor(true)
                  }}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Editor Modal */}
      <NoteEditor
        isOpen={showNoteEditor}
        onClose={() => { setShowNoteEditor(false); setEditingNote(null) }}
        onSave={handleSaveNote}
        initialData={editingNote}
        saving={savingNote}
      />

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

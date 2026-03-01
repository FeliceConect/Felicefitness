"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  Trophy,
  Target,
  Utensils,
  Dumbbell,
  Droplets,
  Moon,
  Scale,
  ClipboardList,
  FileText,
  Award,
  Users,
  Calendar,
  Camera,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

// === Types ===

interface Professional {
  name: string
  type: string
  display_name?: string
  specialty?: string | null
  assigned_at?: string
}

interface Appointment {
  id: string
  type: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  notes: string | null
  reschedule_reason: string | null
  professional: Professional | null
}

interface Meal {
  id: string
  tipo: string
  calorias: number | null
  proteinas: number | null
  carboidratos: number | null
  gorduras: number | null
  data: string
  hora: string | null
}

interface Workout {
  id: string
  nome: string
  tipo: string | null
  duracao: number | null
  calorias: number | null
  data: string
}

interface BodyComp {
  data: string
  peso: number | null
  massa_muscular: number | null
  gordura_corporal: number | null
  gordura_percentual: number | null
}

interface ProgressPhoto {
  id: string
  data: string
  tipo: string | null
  foto_url: string
  peso_no_dia: number | null
}

interface FormAssignment {
  id: string
  templateName: string
  professional: Professional | null
  status: string
  due_date: string | null
  sent_at: string
  completed_at: string | null
}

interface Note {
  id: string
  note_type: string
  content: string
  created_at: string
  professional: Professional | null
}

interface PointTransaction {
  id: string
  points: number
  reason: string
  category: string
  source: string
  created_at: string
}

interface PatientData {
  patient: {
    id: string
    nome: string
    email: string
    foto_url: string | null
    data_nascimento: string | null
    peso_atual: number | null
    altura_cm: number | null
    objetivo: string | null
    genero: string | null
    meta_calorias: number | null
    meta_proteinas: number | null
    meta_carboidratos: number | null
    meta_gorduras: number | null
    meta_agua: number | null
    streak_atual: number | null
    nivel: number | null
    xp_total: number | null
    created_at: string
  }
  team: Professional[]
  appointments: Appointment[]
  stats: {
    nutrition: {
      daysWithMeals: number
      avgCalories: number
      avgProtein: number
      avgCarbs: number
      avgFat: number
    }
    training: {
      totalWorkouts: number
      avgDuration: number
      totalCaloriesBurned: number
      prsCount: number
    }
    hydration: {
      avgDaily: number
      goalMl: number
      daysGoalMet: number
      totalDays: number
    }
    sleep: {
      avgHours: number
      avgQuality: number
      totalDays: number
    }
    weight: {
      current: number | null
      change30d: number
    }
    forms: {
      total: number
      pending: number
      completed: number
    }
  }
  recentMeals: Meal[]
  recentWorkouts: Workout[]
  bodyComposition: BodyComp[]
  lastBioimpedance: Record<string, unknown> | null
  progressPhotos: ProgressPhoto[]
  forms: FormAssignment[]
  notes: Note[]
  notesByProfType?: Record<string, Note[]>
  ranking: { position: number | null; totalPoints: number } | null
  mealPlan: { id: string; name: string; goal: string | null; starts_at: string | null; ends_at: string | null } | null
  trainingProgram: { id: string; name: string; goal: string | null; difficulty: string; starts_at: string | null; ends_at: string | null } | null
  pointTransactions: PointTransaction[]
}

// === Helpers ===

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function profTypeBadge(type: string) {
  switch (type) {
    case 'nutritionist':
      return { label: 'Nutricionista', cls: 'bg-green-500/20 text-green-400 border-green-500/30' }
    case 'trainer':
      return { label: 'Personal', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    case 'coach':
      return { label: 'Coach', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    case 'physiotherapist':
      return { label: 'Fisioterapeuta', cls: 'bg-teal-500/20 text-teal-400 border-teal-500/30' }
    default:
      return { label: type, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return { label: 'Agendada', cls: 'bg-blue-500/20 text-blue-400' }
    case 'confirmed':
      return { label: 'Confirmada', cls: 'bg-green-500/20 text-green-400' }
    case 'completed':
      return { label: 'Realizada', cls: 'bg-slate-500/20 text-slate-400' }
    case 'cancelled':
      return { label: 'Cancelada', cls: 'bg-red-500/20 text-red-400' }
    case 'reschedule_requested':
      return { label: 'Reagendamento', cls: 'bg-yellow-500/20 text-yellow-400' }
    default:
      return { label: status, cls: 'bg-slate-500/20 text-slate-400' }
  }
}

function formStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Preenchido', cls: 'bg-green-500/20 text-green-400' }
    case 'pending':
    case 'sent':
      return { label: 'Pendente', cls: 'bg-yellow-500/20 text-yellow-400' }
    case 'in_progress':
      return { label: 'Em andamento', cls: 'bg-blue-500/20 text-blue-400' }
    case 'expired':
      return { label: 'Expirado', cls: 'bg-red-500/20 text-red-400' }
    default:
      return { label: status, cls: 'bg-slate-500/20 text-slate-400' }
  }
}

function noteTypeBadge(noteType: string) {
  switch (noteType) {
    case 'observation':
      return { label: 'Observação', cls: 'bg-blue-500/20 text-blue-400' }
    case 'evolution':
      return { label: 'Evolução', cls: 'bg-green-500/20 text-green-400' }
    case 'action_plan':
      return { label: 'Plano de ação', cls: 'bg-purple-500/20 text-purple-400' }
    case 'alert':
      return { label: 'Alerta', cls: 'bg-red-500/20 text-red-400' }
    default:
      return { label: noteType, cls: 'bg-slate-500/20 text-slate-400' }
  }
}

// === Collapsible Section ===

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-dourado" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

// === Stat Card ===

function StatCard({ label, value, sub, icon: Icon }: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-dourado" />}
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// === Main Page ===

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [data, setData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/patients/${patientId}`)
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          setError(json.error || 'Erro ao carregar dados')
        }
      } catch {
        setError('Erro de conexão')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [patientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-dourado animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg mb-4">{error || 'Paciente não encontrado'}</p>
        <button
          onClick={() => router.push('/admin/pacientes')}
          className="text-dourado hover:underline"
        >
          Voltar para lista
        </button>
      </div>
    )
  }

  const { patient, team, appointments, stats, recentMeals, recentWorkouts, bodyComposition, lastBioimpedance, progressPhotos, forms, notes, notesByProfType, ranking, mealPlan, trainingProgram, pointTransactions } = data

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const weightTrend = stats.weight.change30d
  const WeightIcon = weightTrend > 0 ? TrendingUp : weightTrend < 0 ? TrendingDown : Minus

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/pacientes')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para pacientes
        </button>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-dourado/20 flex items-center justify-center flex-shrink-0">
              {patient.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={patient.foto_url}
                  alt={patient.nome}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-dourado font-bold text-2xl">
                  {patient.nome?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{patient.nome || 'Sem nome'}</h1>
              <p className="text-slate-400">{patient.email}</p>
              <p className="text-xs text-slate-500 mt-1">
                Membro desde {formatDate(patient.created_at)}
                {patient.data_nascimento && ` · Nasc. ${formatDate(patient.data_nascimento)}`}
                {patient.altura_cm && ` · ${patient.altura_cm}cm`}
                {patient.genero && ` · ${patient.genero}`}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dourado/20 text-dourado rounded-full text-sm font-medium border border-dourado/30">
                <Star className="w-4 h-4" />
                Nível {patient.nivel || 1}
              </span>
              {(patient.streak_atual ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium border border-orange-500/30">
                  <Flame className="w-4 h-4" />
                  {patient.streak_atual} dias
                </span>
              )}
              {patient.objetivo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-full text-sm border border-slate-600">
                  <Target className="w-4 h-4" />
                  {patient.objetivo}
                </span>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            <StatCard
              label="Peso"
              value={stats.weight.current ? `${stats.weight.current} kg` : '-'}
              sub={weightTrend !== 0 ? `${weightTrend > 0 ? '+' : ''}${weightTrend} kg (30d)` : undefined}
              icon={WeightIcon}
            />
            <StatCard
              label="Posição Ranking"
              value={ranking?.position ? `#${ranking.position}` : '-'}
              icon={Trophy}
            />
            <StatCard
              label="Pontos"
              value={ranking?.totalPoints ?? patient.xp_total ?? 0}
              sub={`Nível ${patient.nivel || 1}`}
              icon={Award}
            />
          </div>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Peso atual"
          value={stats.weight.current ? `${stats.weight.current}kg` : '-'}
          sub={weightTrend !== 0 ? `${weightTrend > 0 ? '+' : ''}${weightTrend}kg 30d` : 'estável'}
          icon={Scale}
        />
        <StatCard
          label="Cal média/dia"
          value={stats.nutrition.avgCalories || '-'}
          sub={patient.meta_calorias ? `Meta: ${patient.meta_calorias}` : undefined}
          icon={Utensils}
        />
        <StatCard
          label="Treinos/mês"
          value={stats.training.totalWorkouts}
          sub={`${stats.training.avgDuration}min média`}
          icon={Dumbbell}
        />
        <StatCard
          label="Água média/dia"
          value={stats.hydration.avgDaily ? `${stats.hydration.avgDaily}ml` : '-'}
          sub={`Meta: ${stats.hydration.goalMl}ml`}
          icon={Droplets}
        />
        <StatCard
          label="Sono médio"
          value={stats.sleep.avgHours ? `${stats.sleep.avgHours}h` : '-'}
          sub={stats.sleep.avgQuality ? `Qualidade: ${stats.sleep.avgQuality}/5` : undefined}
          icon={Moon}
        />
        <StatCard
          label="Ranking"
          value={ranking?.position ? `#${ranking.position}` : '-'}
          sub={`${ranking?.totalPoints || 0} pts`}
          icon={Trophy}
        />
      </div>

      {/* Equipe Profissional */}
      <Section title="Equipe Profissional" icon={Users}>
        {team.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhum profissional atribuído</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.map((prof, i) => {
              const badge = profTypeBadge(prof.type)
              return (
                <div key={i} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      prof.type === 'nutritionist' ? 'bg-green-500/20' :
                      prof.type === 'trainer' ? 'bg-blue-500/20' :
                      prof.type === 'physiotherapist' ? 'bg-teal-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <span className={`font-medium text-sm ${
                        prof.type === 'nutritionist' ? 'text-green-400' :
                        prof.type === 'trainer' ? 'text-blue-400' :
                        prof.type === 'physiotherapist' ? 'text-teal-400' :
                        'text-yellow-400'
                      }`}>
                        {(prof.display_name || prof.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{prof.display_name || prof.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {prof.specialty && (
                          <span className="text-xs text-slate-400">{prof.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {prof.assigned_at && (
                    <p className="text-xs text-slate-500 mt-2">Vinculado em {formatDate(prof.assigned_at)}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Histórico de Consultas */}
      <Section title="Histórico de Consultas" icon={Calendar}>
        {appointments.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhuma consulta registrada</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const badge = statusBadge(apt.status)
              return (
                <div key={apt.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {formatDate(apt.date)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {apt.start_time?.slice(0, 5)}{apt.end_time ? ` - ${apt.end_time.slice(0, 5)}` : ''}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {apt.professional && (
                          <>
                            <span className="text-sm text-slate-300">{apt.professional.name}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${profTypeBadge(apt.professional.type).cls}`}>
                              {profTypeBadge(apt.professional.type).label}
                            </span>
                          </>
                        )}
                        {apt.type && (
                          <span className="text-xs text-slate-500">({apt.type})</span>
                        )}
                      </div>
                    </div>
                    {apt.location && (
                      <span className="text-xs text-slate-500">{apt.location}</span>
                    )}
                  </div>
                  {apt.notes && (
                    <p className="text-xs text-slate-400 mt-2 border-t border-slate-600/50 pt-2">{apt.notes}</p>
                  )}
                  {apt.reschedule_reason && (
                    <p className="text-xs text-yellow-400/80 mt-1">Motivo reagendamento: {apt.reschedule_reason}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Alimentação */}
      <Section title="Alimentação" icon={Utensils}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Cal média/dia"
            value={stats.nutrition.avgCalories || '-'}
            sub={patient.meta_calorias ? `Meta: ${patient.meta_calorias}` : undefined}
          />
          <StatCard
            label="Proteína média"
            value={stats.nutrition.avgProtein ? `${stats.nutrition.avgProtein}g` : '-'}
            sub={patient.meta_proteinas ? `Meta: ${patient.meta_proteinas}g` : undefined}
          />
          <StatCard
            label="Carboidratos"
            value={stats.nutrition.avgCarbs ? `${stats.nutrition.avgCarbs}g` : '-'}
            sub={patient.meta_carboidratos ? `Meta: ${patient.meta_carboidratos}g` : undefined}
          />
          <StatCard
            label="Gordura"
            value={stats.nutrition.avgFat ? `${stats.nutrition.avgFat}g` : '-'}
            sub={patient.meta_gorduras ? `Meta: ${patient.meta_gorduras}g` : undefined}
          />
        </div>

        {mealPlan && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm font-medium">Plano alimentar ativo: {mealPlan.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {mealPlan.goal && `Objetivo: ${mealPlan.goal}`}
              {mealPlan.starts_at && ` · Início: ${formatDate(mealPlan.starts_at)}`}
              {mealPlan.ends_at && ` · Fim: ${formatDate(mealPlan.ends_at)}`}
            </p>
          </div>
        )}

        {recentMeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600/50">
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Data</th>
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Tipo</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Cal</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Prot</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Carb</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Gord</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentMeals.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/30">
                    <td className="py-2 text-slate-300">{formatDate(m.data)}</td>
                    <td className="py-2 text-slate-300 capitalize">{m.tipo || '-'}</td>
                    <td className="py-2 text-right text-slate-300">{m.calorias || '-'}</td>
                    <td className="py-2 text-right text-slate-300">{m.proteinas ? `${m.proteinas}g` : '-'}</td>
                    <td className="py-2 text-right text-slate-300">{m.carboidratos ? `${m.carboidratos}g` : '-'}</td>
                    <td className="py-2 text-right text-slate-300">{m.gorduras ? `${m.gorduras}g` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Nenhuma refeição nos últimos 30 dias</p>
        )}
      </Section>

      {/* Treino */}
      <Section title="Treino" icon={Dumbbell}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total treinos" value={stats.training.totalWorkouts} />
          <StatCard label="Duração média" value={stats.training.avgDuration ? `${stats.training.avgDuration}min` : '-'} />
          <StatCard label="Cal queimadas" value={stats.training.totalCaloriesBurned || '-'} />
          <StatCard label="PRs" value={stats.training.prsCount} icon={Award} />
        </div>

        {trainingProgram && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-blue-400 text-sm font-medium">Programa ativo: {trainingProgram.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {trainingProgram.goal && `Objetivo: ${trainingProgram.goal}`}
              {trainingProgram.difficulty && ` · ${trainingProgram.difficulty}`}
              {trainingProgram.starts_at && ` · Início: ${formatDate(trainingProgram.starts_at)}`}
              {trainingProgram.ends_at && ` · Fim: ${formatDate(trainingProgram.ends_at)}`}
            </p>
          </div>
        )}

        {recentWorkouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600/50">
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Data</th>
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Nome</th>
                  <th className="text-left py-2 text-xs text-slate-400 font-medium">Tipo</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Duração</th>
                  <th className="text-right py-2 text-xs text-slate-400 font-medium">Cal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentWorkouts.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-700/30">
                    <td className="py-2 text-slate-300">{formatDate(w.data)}</td>
                    <td className="py-2 text-slate-300">{w.nome || '-'}</td>
                    <td className="py-2 text-slate-300 capitalize">{w.tipo || '-'}</td>
                    <td className="py-2 text-right text-slate-300">{w.duracao ? `${w.duracao}min` : '-'}</td>
                    <td className="py-2 text-right text-slate-300">{w.calorias || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Nenhum treino nos últimos 30 dias</p>
        )}
      </Section>

      {/* Corpo & Evolução */}
      <Section title="Corpo & Evolução" icon={Scale}>
        {bodyComposition.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard
                label="Peso"
                value={bodyComposition[0].peso ? `${bodyComposition[0].peso}kg` : '-'}
              />
              <StatCard
                label="% Gordura"
                value={bodyComposition[0].gordura_percentual ? `${bodyComposition[0].gordura_percentual}%` : '-'}
              />
              <StatCard
                label="Massa Muscular"
                value={bodyComposition[0].massa_muscular ? `${bodyComposition[0].massa_muscular}kg` : '-'}
              />
              <StatCard
                label="IMC"
                value={
                  bodyComposition[0].peso && patient.altura_cm
                    ? (bodyComposition[0].peso / ((patient.altura_cm / 100) ** 2)).toFixed(1)
                    : '-'
                }
              />
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600/50">
                    <th className="text-left py-2 text-xs text-slate-400 font-medium">Data</th>
                    <th className="text-right py-2 text-xs text-slate-400 font-medium">Peso</th>
                    <th className="text-right py-2 text-xs text-slate-400 font-medium">% Gord.</th>
                    <th className="text-right py-2 text-xs text-slate-400 font-medium">M. Muscular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {bodyComposition.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-700/30">
                      <td className="py-2 text-slate-300">{formatDate(b.data)}</td>
                      <td className="py-2 text-right text-slate-300">{b.peso ? `${b.peso}kg` : '-'}</td>
                      <td className="py-2 text-right text-slate-300">{b.gordura_percentual ? `${b.gordura_percentual}%` : '-'}</td>
                      <td className="py-2 text-right text-slate-300">{b.massa_muscular ? `${b.massa_muscular}kg` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lastBioimpedance && (
              <div className="bg-dourado/10 border border-dourado/30 rounded-lg p-3 mb-4">
                <p className="text-dourado text-sm font-medium mb-1">Última Bioimpedância</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {!!lastBioimpedance.data && (
                    <span className="text-slate-400">Data: <span className="text-slate-300">{formatDate(String(lastBioimpedance.data))}</span></span>
                  )}
                  {!!lastBioimpedance.peso && (
                    <span className="text-slate-400">Peso: <span className="text-slate-300">{String(lastBioimpedance.peso)}kg</span></span>
                  )}
                  {!!lastBioimpedance.agua_corporal && (
                    <span className="text-slate-400">Água corp.: <span className="text-slate-300">{String(lastBioimpedance.agua_corporal)}%</span></span>
                  )}
                  {!!lastBioimpedance.massa_ossea && (
                    <span className="text-slate-400">Massa óssea: <span className="text-slate-300">{String(lastBioimpedance.massa_ossea)}kg</span></span>
                  )}
                  {!!lastBioimpedance.metabolismo_basal && (
                    <span className="text-slate-400">TMB: <span className="text-slate-300">{String(lastBioimpedance.metabolismo_basal)}kcal</span></span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400 text-sm mb-4">Nenhuma medição corporal registrada</p>
        )}

        {/* Fotos de progresso */}
        {progressPhotos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-dourado" />
              Fotos de Progresso
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {progressPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.foto_url}
                    alt={`Progresso ${photo.data}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                    <p className="text-[10px] text-white text-center">{formatDate(photo.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Hidratação & Sono */}
      <Section title="Hidratação & Sono" icon={Droplets}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Água */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              Hidratação
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Média/dia" value={stats.hydration.avgDaily ? `${stats.hydration.avgDaily}ml` : '-'} />
              <StatCard label="Meta" value={`${stats.hydration.goalMl}ml`} />
              <StatCard
                label="Meta atingida"
                value={stats.hydration.totalDays > 0 ? `${Math.round((stats.hydration.daysGoalMet / stats.hydration.totalDays) * 100)}%` : '-'}
                sub={`${stats.hydration.daysGoalMet}/${stats.hydration.totalDays} dias`}
              />
            </div>
          </div>

          {/* Sono */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              Sono
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Média horas" value={stats.sleep.avgHours ? `${stats.sleep.avgHours}h` : '-'} />
              <StatCard label="Qualidade média" value={stats.sleep.avgQuality ? `${stats.sleep.avgQuality}/5` : '-'} />
            </div>
          </div>
        </div>
      </Section>

      {/* Formulários */}
      <Section title="Formulários" icon={ClipboardList}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Total" value={stats.forms.total} />
          <StatCard label="Pendentes" value={stats.forms.pending} />
          <StatCard label="Preenchidos" value={stats.forms.completed} />
        </div>

        {forms.length > 0 ? (
          <div className="space-y-2">
            {forms.map((f) => {
              const badge = formStatusBadge(f.status)
              return (
                <div key={f.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-white text-sm font-medium">{f.templateName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {f.professional && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${profTypeBadge(f.professional.type).cls}`}>
                          {f.professional.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Enviado: {formatDate(f.sent_at)}</span>
                      {f.completed_at && (
                        <span className="text-xs text-slate-500">Preenchido: {formatDate(f.completed_at)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Nenhum formulário</p>
        )}
      </Section>

      {/* Prontuário */}
      <Section title="Prontuário (Notas Profissionais)" icon={FileText}>
        {notes.length > 0 ? (
          notesByProfType && Object.keys(notesByProfType).length > 0 ? (
            <div className="space-y-6">
              {(['nutritionist', 'trainer', 'physiotherapist', 'coach'] as const).map((profType) => {
                const groupNotes = notesByProfType[profType]
                if (!groupNotes || groupNotes.length === 0) return null
                const typeInfo = profTypeBadge(profType)
                return (
                  <div key={profType}>
                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${typeInfo.cls.split(' ')[1]}`}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeInfo.cls}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-slate-500 text-xs font-normal">({groupNotes.length} {groupNotes.length === 1 ? 'nota' : 'notas'})</span>
                    </h3>
                    <div className="space-y-2">
                      {groupNotes.map((n) => {
                        const badge = noteTypeBadge(n.note_type)
                        const isExpanded = expandedNotes.has(n.id)
                        const isLong = n.content.length > 200
                        return (
                          <div key={n.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                                  {badge.label}
                                </span>
                                {n.professional && (
                                  <span className="text-xs text-slate-400">
                                    {n.professional.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(n.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                              {isLong && !isExpanded ? n.content.slice(0, 200) + '...' : n.content}
                            </p>
                            {isLong && (
                              <button
                                onClick={() => toggleNote(n.id)}
                                className="text-xs text-dourado hover:underline mt-1"
                              >
                                {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => {
                const badge = noteTypeBadge(n.note_type)
                const isExpanded = expandedNotes.has(n.id)
                const isLong = n.content.length > 200
                return (
                  <div key={n.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {n.professional && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${profTypeBadge(n.professional.type).cls}`}>
                            {n.professional.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                      {isLong && !isExpanded ? n.content.slice(0, 200) + '...' : n.content}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleNote(n.id)}
                        className="text-xs text-dourado hover:underline mt-1"
                      >
                        {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <p className="text-slate-400 text-sm">Nenhuma nota registrada</p>
        )}
      </Section>

      {/* Ranking & Pontuação */}
      <Section title="Ranking & Pontuação" icon={Trophy}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard
            label="Posição"
            value={ranking?.position ? `#${ranking.position}` : '-'}
            icon={Trophy}
          />
          <StatCard
            label="Pontos"
            value={ranking?.totalPoints ?? patient.xp_total ?? 0}
            icon={Award}
          />
          <StatCard
            label="Nível"
            value={patient.nivel || 1}
            icon={Star}
          />
        </div>

        {pointTransactions.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Últimas transações</h3>
            <div className="space-y-1">
              {pointTransactions.map((pt) => (
                <div key={pt.id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                  <div>
                    <p className="text-sm text-slate-300">{pt.reason}</p>
                    <p className="text-xs text-slate-500">{pt.category} · {formatDateTime(pt.created_at)}</p>
                  </div>
                  <span className={`text-sm font-medium ${pt.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pt.points > 0 ? '+' : ''}{pt.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Nenhuma transação de pontos</p>
        )}
      </Section>
    </div>
  )
}

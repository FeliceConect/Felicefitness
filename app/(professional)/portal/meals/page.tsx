'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfessional } from '@/hooks/use-professional'
import {
  Utensils,
  Search,
  Calendar,
  ArrowLeft,
  Flame,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Image as ImageIcon
} from 'lucide-react'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url: string | null
}

interface Meal {
  id: string
  user_id: string
  meal_date: string
  meal_time: string
  meal_type: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  foods: Array<{
    name: string
    quantity: number
    unit: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }>
  photo_url: string | null
  notes: string | null
  ai_analysis: string | null
  profile?: {
    id: string
    nome: string
    email: string
    avatar_url: string | null
  }
}

interface Stats {
  totalMeals: number
  totalCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  mealsPerClient: Record<string, number>
}

const mealTypeIcons: Record<string, React.ReactNode> = {
  'cafe_manha': <Coffee className="w-4 h-4" />,
  'lanche_manha': <Apple className="w-4 h-4" />,
  'almoco': <Sun className="w-4 h-4" />,
  'lanche_tarde': <Cookie className="w-4 h-4" />,
  'jantar': <Moon className="w-4 h-4" />,
  'ceia': <Moon className="w-4 h-4" />
}

const mealTypeLabels: Record<string, string> = {
  'cafe_manha': 'Cafe da Manha',
  'lanche_manha': 'Lanche da Manha',
  'almoco': 'Almoco',
  'lanche_tarde': 'Lanche da Tarde',
  'jantar': 'Jantar',
  'ceia': 'Ceia'
}

export default function PortalMealsPage() {
  const router = useRouter()
  const { professional, loading: profLoading } = useProfessional()
  const [meals, setMeals] = useState<Meal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedMealType, setSelectedMealType] = useState<string>('')
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'custom'>('7d')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Expandir detalhes
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profLoading && professional) {
      fetchMeals()
    }
  }, [profLoading, professional, selectedClient, selectedMealType, dateRange, startDate, endDate])

  const fetchMeals = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (selectedClient) {
        params.append('clientId', selectedClient)
      }

      if (selectedMealType) {
        params.append('mealType', selectedMealType)
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

      const response = await fetch(`/api/portal/client-meals?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setMeals(data.meals || [])
        setClients(data.clients || [])
        setStats(data.stats || null)
      } else {
        setError(data.error || 'Erro ao carregar refeicoes')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar refeicoes')
    } finally {
      setLoading(false)
    }
  }

  const toggleMealExpanded = (mealId: string) => {
    const newExpanded = new Set(expandedMeals)
    if (newExpanded.has(mealId)) {
      newExpanded.delete(mealId)
    } else {
      newExpanded.add(mealId)
    }
    setExpandedMeals(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    return timeStr.substring(0, 5)
  }

  // Filtrar por busca
  const filteredMeals = meals.filter(meal => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      meal.description?.toLowerCase().includes(term) ||
      meal.profile?.nome?.toLowerCase().includes(term) ||
      mealTypeLabels[meal.meal_type]?.toLowerCase().includes(term)
    )
  })

  // Agrupar por data
  const groupedMeals: Record<string, Meal[]> = {}
  filteredMeals.forEach(meal => {
    const date = meal.meal_date
    if (!groupedMeals[date]) {
      groupedMeals[date] = []
    }
    groupedMeals[date].push(meal)
  })

  // Ordenar datas (mais recente primeiro)
  const sortedDates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a))

  if (profLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dourado"></div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="p-6 text-center">
        <p className="text-error">Acesso restrito a profissionais</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal')}
          className="p-2 rounded-lg bg-white border border-border hover:bg-background-elevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-green-500" />
            Refeições dos Clientes
          </h1>
          <p className="text-sm text-foreground-secondary">
            {filteredMeals.length} refeições encontradas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar por descricao ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-border text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado/50"
          />
        </div>

        {/* Filtros em linha */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 min-w-[140px]"
          >
            <option value="">Todos os clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </select>

          <select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 min-w-[140px]"
          >
            <option value="">Todas refeições</option>
            {Object.entries(mealTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '14d' | '30d' | 'custom')}
            className="px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 min-w-[120px]"
          >
            <option value="7d">7 dias</option>
            <option value="14d">14 dias</option>
            <option value="30d">30 dias</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Total Calorias</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalCalories.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Média Proteína</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgProtein}g</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Apple className="w-4 h-4" />
              <span className="text-xs font-medium">Média Carbs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgCarbs}g</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-medium">Total Refeições</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalMeals}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dourado"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-error">{error}</p>
          <button
            onClick={fetchMeals}
            className="mt-4 px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <Utensils className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Nenhuma refeição encontrada</h3>
          <p className="text-foreground-secondary mt-2">
            Ajuste os filtros ou aguarde seus clientes registrarem refeições
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              {/* Header do dia */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-dourado" />
                <span className="font-semibold text-dourado">{formatDate(date)}</span>
                <span className="text-foreground-muted text-sm">
                  ({groupedMeals[date].length} refeições)
                </span>
              </div>

              {/* Refeições do dia */}
              <div className="space-y-3">
                {groupedMeals[date].map(meal => (
                  <div
                    key={meal.id}
                    className="bg-white rounded-xl border border-border overflow-hidden"
                  >
                    {/* Header da refeição */}
                    <button
                      onClick={() => toggleMealExpanded(meal.id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-background-elevated/50 transition-colors"
                    >
                      {/* Avatar do cliente */}
                      <div className="w-10 h-10 rounded-full bg-dourado/10 flex items-center justify-center text-dourado font-bold shrink-0">
                        {meal.profile?.nome?.charAt(0) || 'C'}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{meal.profile?.nome || 'Cliente'}</span>
                          <span className="text-foreground-muted">-</span>
                          <span className="flex items-center gap-1 text-sm text-foreground-secondary">
                            {mealTypeIcons[meal.meal_type]}
                            {mealTypeLabels[meal.meal_type] || meal.meal_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-foreground-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(meal.meal_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {meal.calories || 0} kcal
                          </span>
                          {meal.photo_url && (
                            <span className="flex items-center gap-1 text-green-500">
                              <ImageIcon className="w-3 h-3" />
                              Com foto
                            </span>
                          )}
                        </div>
                      </div>

                      {expandedMeals.has(meal.id) ? (
                        <ChevronDown className="w-5 h-5 text-foreground-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-foreground-muted" />
                      )}
                    </button>

                    {/* Detalhes expandidos */}
                    {expandedMeals.has(meal.id) && (
                      <div className="px-4 pb-4 border-t border-border">
                        {meal.description && (
                          <div className="mt-4">
                            <p className="text-foreground-secondary">{meal.description}</p>
                          </div>
                        )}

                        {meal.photo_url && (
                          <div className="mt-4">
                            <img
                              src={meal.photo_url}
                              alt="Foto da refeição"
                              className="w-full max-w-md rounded-lg"
                            />
                          </div>
                        )}

                        {/* Macros */}
                        <div className="mt-4 grid grid-cols-4 gap-2">
                          <div className="bg-background-elevated rounded-lg p-3 text-center">
                            <p className="text-xs text-foreground-muted">Calorias</p>
                            <p className="text-lg font-bold text-orange-500">{meal.calories || 0}</p>
                          </div>
                          <div className="bg-background-elevated rounded-lg p-3 text-center">
                            <p className="text-xs text-foreground-muted">Proteína</p>
                            <p className="text-lg font-bold text-blue-500">{meal.protein || 0}g</p>
                          </div>
                          <div className="bg-background-elevated rounded-lg p-3 text-center">
                            <p className="text-xs text-foreground-muted">Carbs</p>
                            <p className="text-lg font-bold text-amber-500">{meal.carbs || 0}g</p>
                          </div>
                          <div className="bg-background-elevated rounded-lg p-3 text-center">
                            <p className="text-xs text-foreground-muted">Gordura</p>
                            <p className="text-lg font-bold text-purple-500">{meal.fat || 0}g</p>
                          </div>
                        </div>

                        {/* Alimentos */}
                        {meal.foods && meal.foods.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-foreground-secondary mb-2">Alimentos</h4>
                            <div className="space-y-2">
                              {meal.foods.map((food, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-background-elevated rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <p className="font-medium text-foreground">{food.name}</p>
                                    <p className="text-xs text-foreground-muted">
                                      {food.quantity} {food.unit}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-orange-500">{food.calories} kcal</p>
                                    <p className="text-xs text-foreground-muted">
                                      P:{food.protein}g C:{food.carbs}g G:{food.fat}g
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {meal.notes && (
                          <div className="mt-4 p-3 bg-background-elevated rounded-lg">
                            <h4 className="text-sm font-semibold text-foreground-secondary mb-1">Observações</h4>
                            <p className="text-sm text-foreground-secondary">{meal.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

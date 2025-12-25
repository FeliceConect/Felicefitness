"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, ChevronRight, Target, Loader2 } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { leonardoGoals } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

type TimeRange = '7dias' | '30dias' | '90dias'

interface DayHistory {
  date: string
  totals: {
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
}

export default function NutritionHistoryPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<TimeRange>('7dias')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [history, setHistory] = useState<DayHistory[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Calculate number of days based on time range
  const getDaysCount = useCallback(() => {
    switch (timeRange) {
      case '7dias': return 7
      case '30dias': return 30
      case '90dias': return 90
      default: return 7
    }
  }, [timeRange])

  // Load real data from database
  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHistory([])
        return
      }

      const daysCount = getDaysCount()
      const startDate = format(subDays(new Date(), daysCount - 1), 'yyyy-MM-dd')
      const endDate = format(new Date(), 'yyyy-MM-dd')

      // Fetch meals grouped by date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData, error } = await (supabase as any)
        .from('fitness_meals')
        .select('data, calorias_total, proteinas_total, carboidratos_total, gorduras_total')
        .eq('user_id', user.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: false })

      if (error) {
        console.error('Error loading nutrition history:', error)
        setHistory([])
        return
      }

      // Group by date and sum totals
      const groupedByDate: Record<string, DayHistory['totals']> = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const meal of (mealsData || [])) {
        const mealData = meal as { data: string; calorias_total: number; proteinas_total: number; carboidratos_total: number; gorduras_total: number }
        const existing = groupedByDate[mealData.data] || {
          calorias: 0,
          proteinas: 0,
          carboidratos: 0,
          gorduras: 0
        }

        groupedByDate[mealData.data] = {
          calorias: existing.calorias + (mealData.calorias_total || 0),
          proteinas: existing.proteinas + (mealData.proteinas_total || 0),
          carboidratos: existing.carboidratos + (mealData.carboidratos_total || 0),
          gorduras: existing.gorduras + (mealData.gorduras_total || 0)
        }
      }

      // Convert to array sorted by date descending
      const historyData: DayHistory[] = Object.entries(groupedByDate)
        .map(([date, totals]) => ({ date, totals }))
        .sort((a, b) => b.date.localeCompare(a.date))

      setHistory(historyData)
    } catch (err) {
      console.error('Error loading nutrition history:', err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [supabase, getDaysCount])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Calcular médias
  const averages = useMemo(() => {
    if (history.length === 0) {
      return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    }

    const total = history.reduce(
      (acc, day) => ({
        calorias: acc.calorias + day.totals.calorias,
        proteinas: acc.proteinas + day.totals.proteinas,
        carboidratos: acc.carboidratos + day.totals.carboidratos,
        gorduras: acc.gorduras + day.totals.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    const days = history.length
    return {
      calorias: Math.round(total.calorias / days),
      proteinas: Math.round(total.proteinas / days),
      carboidratos: Math.round(total.carboidratos / days),
      gorduras: Math.round(total.gorduras / days)
    }
  }, [history])

  // Calcular tendência (comparando primeira metade com segunda)
  const trends = useMemo(() => {
    const mid = Math.floor(history.length / 2)
    const firstHalf = history.slice(mid)
    const secondHalf = history.slice(0, mid)

    const avgCalc = (arr: typeof history, key: 'calorias' | 'proteinas' | 'carboidratos' | 'gorduras') =>
      arr.length > 0 ? arr.reduce((sum, d) => sum + d.totals[key], 0) / arr.length : 0

    return {
      calorias: avgCalc(secondHalf, 'calorias') - avgCalc(firstHalf, 'calorias'),
      proteinas: avgCalc(secondHalf, 'proteinas') - avgCalc(firstHalf, 'proteinas'),
      carboidratos: avgCalc(secondHalf, 'carboidratos') - avgCalc(firstHalf, 'carboidratos'),
      gorduras: avgCalc(secondHalf, 'gorduras') - avgCalc(firstHalf, 'gorduras')
    }
  }, [history])

  // Calcular compliance (dias dentro da meta)
  const compliance = useMemo(() => {
    if (history.length === 0) return 0

    const goals = leonardoGoals
    let daysOnTarget = 0

    history.forEach(day => {
      const calPercent = (day.totals.calorias / goals.calorias) * 100
      const protPercent = (day.totals.proteinas / goals.proteinas) * 100

      // Considera "no alvo" se calorias entre 90-110% e proteína >= 90%
      if (calPercent >= 90 && calPercent <= 110 && protPercent >= 90) {
        daysOnTarget++
      }
    })

    return Math.round((daysOnTarget / history.length) * 100)
  }, [history])

  // Gerar dados para a semana atual
  const weekDays = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 0 })
    const end = endOfWeek(today, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [])

  const getTrendIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="w-4 h-4 text-emerald-400" />
    if (value < -5) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getProgressColor = (current: number, goal: number) => {
    const percent = (current / goal) * 100
    if (percent >= 90 && percent <= 110) return 'text-emerald-400'
    if (percent >= 80 && percent < 90) return 'text-amber-400'
    return 'text-red-400'
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

        <h1 className="text-2xl font-bold text-white mb-2">Histórico Nutricional</h1>
        <p className="text-slate-400">Acompanhe sua evolução</p>
      </div>

      {/* Time range selector */}
      <div className="px-4 mb-6">
        <div className="flex bg-[#14141F] rounded-xl p-1">
          {(['7dias', '30dias', '90dias'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                timeRange === range
                  ? 'bg-violet-500 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {range === '7dias' ? '7 dias' : range === '30dias' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Taxa de Conformidade</p>
              <p className="text-3xl font-bold text-white">{compliance}%</p>
              <p className="text-xs text-slate-500 mt-1">
                Dias dentro da meta de calorias e proteína
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-violet-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Averages */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Médias do Período
        </h3>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Calorias */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Calorias</p>
              {getTrendIcon(trends.calorias)}
            </div>
            <p className={cn('text-2xl font-bold', getProgressColor(averages.calorias, leonardoGoals.calorias))}>
              {averages.calorias}
            </p>
            <p className="text-xs text-slate-500">Meta: {leonardoGoals.calorias} kcal</p>
          </div>

          {/* Proteína */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Proteína</p>
              {getTrendIcon(trends.proteinas)}
            </div>
            <p className={cn('text-2xl font-bold', getProgressColor(averages.proteinas, leonardoGoals.proteinas))}>
              {averages.proteinas}g
            </p>
            <p className="text-xs text-slate-500">Meta: {leonardoGoals.proteinas}g</p>
          </div>

          {/* Carboidratos */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Carboidratos</p>
              {getTrendIcon(trends.carboidratos)}
            </div>
            <p className={cn('text-2xl font-bold', getProgressColor(averages.carboidratos, leonardoGoals.carboidratos))}>
              {averages.carboidratos}g
            </p>
            <p className="text-xs text-slate-500">Meta: {leonardoGoals.carboidratos}g</p>
          </div>

          {/* Gorduras */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Gorduras</p>
              {getTrendIcon(trends.gorduras)}
            </div>
            <p className={cn('text-2xl font-bold', getProgressColor(averages.gorduras, leonardoGoals.gorduras))}>
              {averages.gorduras}g
            </p>
            <p className="text-xs text-slate-500">Meta: {leonardoGoals.gorduras}g</p>
          </div>
        </motion.div>
      </div>

      {/* Week view */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Esta Semana
        </h3>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
        >
          <div className="flex justify-between">
            {weekDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayData = history.find(h => h.date === dateStr)
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
              const isFuture = day > new Date()

              const calPercent = dayData
                ? Math.round((dayData.totals.calorias / leonardoGoals.calorias) * 100)
                : 0

              return (
                <div
                  key={index}
                  className={cn(
                    'flex flex-col items-center',
                    isToday && 'relative'
                  )}
                >
                  <p className={cn(
                    'text-xs mb-2',
                    isToday ? 'text-violet-400 font-medium' : 'text-slate-500'
                  )}>
                    {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                  </p>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isFuture
                        ? 'bg-slate-800 text-slate-600'
                        : calPercent >= 90 && calPercent <= 110
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : calPercent > 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-500'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {isToday && (
                    <div className="absolute -bottom-2 w-1 h-1 bg-violet-500 rounded-full" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Daily history */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Histórico Diário
        </h3>

        {/* Empty state */}
        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-8 text-center"
          >
            <div className="text-4xl mb-4">🍽️</div>
            <p className="text-white font-medium mb-2">Nenhuma refeição registrada</p>
            <p className="text-sm text-slate-400 mb-4">
              Comece a registrar suas refeições para acompanhar seu histórico nutricional.
            </p>
            <button
              onClick={() => router.push('/alimentacao/refeicao/nova')}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Registrar primeira refeição
            </button>
          </motion.div>
        )}

        <div className="space-y-2">
          {history.map((day, index) => {
            const calPercent = Math.round((day.totals.calorias / leonardoGoals.calorias) * 100)
            const protPercent = Math.round((day.totals.proteinas / leonardoGoals.proteinas) * 100)
            const isOnTarget = calPercent >= 90 && calPercent <= 110 && protPercent >= 90

            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDate(selectedDate === day.date ? null : day.date)}
                className={cn(
                  'bg-[#14141F] border rounded-xl p-4 cursor-pointer transition-all',
                  selectedDate === day.date
                    ? 'border-violet-500/50'
                    : 'border-[#2E2E3E] hover:border-violet-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isOnTarget
                          ? 'bg-emerald-500/20'
                          : 'bg-amber-500/20'
                      )}
                    >
                      <Calendar className={cn(
                        'w-5 h-5',
                        isOnTarget ? 'text-emerald-400' : 'text-amber-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-slate-400">
                        {day.totals.calorias} kcal • {day.totals.proteinas}g prot
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    'w-5 h-5 text-slate-500 transition-transform',
                    selectedDate === day.date && 'rotate-90'
                  )} />
                </div>

                {/* Expanded details */}
                {selectedDate === day.date && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-[#2E2E3E]"
                  >
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">{day.totals.calorias}</p>
                        <p className="text-xs text-slate-500">kcal</p>
                        <p className="text-xs text-emerald-400 mt-1">{calPercent}%</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-violet-400">{day.totals.proteinas}g</p>
                        <p className="text-xs text-slate-500">prot</p>
                        <p className="text-xs text-emerald-400 mt-1">{protPercent}%</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-cyan-400">{day.totals.carboidratos}g</p>
                        <p className="text-xs text-slate-500">carb</p>
                        <p className="text-xs text-emerald-400 mt-1">
                          {Math.round((day.totals.carboidratos / leonardoGoals.carboidratos) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-400">{day.totals.gorduras}g</p>
                        <p className="text-xs text-slate-500">gord</p>
                        <p className="text-xs text-emerald-400 mt-1">
                          {Math.round((day.totals.gorduras / leonardoGoals.gorduras) * 100)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

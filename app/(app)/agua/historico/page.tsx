"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, TrendingUp, Target, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { WaterWeeklyChart } from '@/components/agua'
import { useWaterStats } from '@/hooks/use-water-stats'
import { formatWaterAmount } from '@/lib/water/calculations'
import { DEFAULT_WATER_GOAL } from '@/lib/water/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function WaterHistoryPage() {
  const router = useRouter()
  const stats = useWaterStats()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthData, setMonthData] = useState<Record<string, number>>({})
  const [, setIsLoadingMonth] = useState(true)
  const goal = DEFAULT_WATER_GOAL

  // Carregar dados do mês
  const loadMonthData = useCallback(async () => {
    setIsLoadingMonth(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMonthData({})
        setIsLoadingMonth(false)
        return
      }

      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_water_logs')
        .select('data, quantidade_ml')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)

      if (error) throw error

      // Agrupar por dia
      const grouped: Record<string, number> = {}
      data?.forEach((log: { data: string; quantidade_ml: number }) => {
        if (!grouped[log.data]) {
          grouped[log.data] = 0
        }
        grouped[log.data] += log.quantidade_ml
      })

      setMonthData(grouped)
    } catch (err) {
      console.error('Erro ao carregar dados do mês:', err)
      setMonthData({})
    } finally {
      setIsLoadingMonth(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadMonthData()
  }, [loadMonthData])

  // Gerar dias do mês para o calendário
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Calcular estatísticas do mês (dados reais)
  const monthStats = useMemo(() => {
    const daysInMonth = calendarDays.length
    const daysWithData = Object.keys(monthData).length
    const totalMonth = Object.values(monthData).reduce((sum, val) => sum + val, 0)
    const avgDaily = daysWithData > 0 ? Math.round(totalMonth / daysWithData) : 0
    const daysMetGoal = Object.values(monthData).filter(val => val >= goal).length

    return {
      daysMetGoal,
      totalDays: daysInMonth,
      avgDaily,
      totalMonth,
      bestStreak: stats.bestStreak
    }
  }, [calendarDays, monthData, goal, stats.bestStreak])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    if (next <= new Date()) {
      setCurrentMonth(next)
    }
  }

  // Buscar dados reais do dia
  const getDayData = (date: Date) => {
    if (date > new Date()) {
      return { total: 0, status: 'future' as const }
    }

    const dateStr = format(date, 'yyyy-MM-dd')
    const total = monthData[dateStr] || 0
    const percentage = total / goal

    let status: 'met' | 'partial' | 'low' | 'future'
    if (total === 0) status = 'low'
    else if (percentage >= 1) status = 'met'
    else if (percentage >= 0.8) status = 'partial'
    else status = 'low'

    return { total, status }
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

        <h1 className="text-2xl font-bold text-white">Histórico de Hidratação</h1>
        <p className="text-slate-400 text-sm">Acompanhe sua evolução</p>
      </div>

      {/* Weekly Chart */}
      <div className="px-4 mb-6">
        <WaterWeeklyChart
          data={stats.weeklyData}
          goal={goal}
        />
      </div>

      {/* Month summary */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border border-cyan-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Resumo do Mês
            </h3>
            <span className="text-white font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Média diária */}
            <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Média diária</span>
              </div>
              <p className="text-xl font-bold text-cyan-400">
                {formatWaterAmount(monthStats.avgDaily)}
              </p>
            </div>

            {/* Dias na meta */}
            <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-500">Meta atingida</span>
              </div>
              <p className="text-xl font-bold text-white">
                {monthStats.daysMetGoal}
                <span className="text-slate-500 font-normal">/{monthStats.totalDays}</span>
              </p>
              <p className="text-xs text-emerald-400">
                {Math.round((monthStats.daysMetGoal / monthStats.totalDays) * 100)}%
              </p>
            </div>

            {/* Total do mês */}
            <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-slate-500">Total do mês</span>
              </div>
              <p className="text-xl font-bold text-violet-400">
                {(monthStats.totalMonth / 1000).toFixed(1)}L
              </p>
            </div>

            {/* Melhor streak */}
            <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-500">Maior streak</span>
              </div>
              <p className="text-xl font-bold text-orange-400">
                {monthStats.bestStreak} dias
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Calendar */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>

            <h3 className="text-white font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>

            <button
              onClick={handleNextMonth}
              disabled={isSameMonth(currentMonth, new Date())}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isSameMonth(currentMonth, new Date())
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-slate-800'
              )}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {calendarDays.map(date => {
              const dayData = getDayData(date)
              const isTodayDate = isToday(date)

              return (
                <motion.div
                  key={date.toISOString()}
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative',
                    dayData.status === 'met' && 'bg-emerald-500/20',
                    dayData.status === 'partial' && 'bg-amber-500/20',
                    dayData.status === 'low' && 'bg-red-500/10',
                    dayData.status === 'future' && 'bg-slate-800/30',
                    isTodayDate && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#14141F]'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    dayData.status === 'met' ? 'text-emerald-400' :
                    dayData.status === 'partial' ? 'text-amber-400' :
                    dayData.status === 'future' ? 'text-slate-600' :
                    'text-slate-400'
                  )}>
                    {format(date, 'd')}
                  </span>
                  {dayData.status === 'met' && (
                    <span className="text-[8px]">✓</span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/30" />
              <span>Meta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500/30" />
              <span>&gt;80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/20" />
              <span>&lt;80%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tips section */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Dicas de Hidratação
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-sm text-slate-300">
                Beba água assim que acordar para reidratar após o sono.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">⏰</span>
              <p className="text-sm text-slate-300">
                Configure lembretes para beber água a cada 2-3 horas.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🏃</span>
              <p className="text-sm text-slate-300">
                Aumente a ingestão em dias de treino ou calor intenso.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

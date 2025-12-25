"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, SortAsc, SortDesc } from 'lucide-react'
import { format, parseISO, subMonths, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MeasurementCard } from '@/components/corpo'
import { useBodyComposition } from '@/hooks/use-body-composition'
import { cn } from '@/lib/utils'

type SortOrder = 'desc' | 'asc'
type FilterPeriod = 'all' | '3m' | '6m' | '1y'

export default function HistoricoPage() {
  const router = useRouter()
  const { measurements, stats, isLoading } = useBodyComposition()

  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all')
  const [showCompare, setShowCompare] = useState(true)

  // Filter and sort measurements
  const filteredMeasurements = useMemo(() => {
    let result = [...measurements]

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (filterPeriod) {
        case '3m':
          cutoffDate = subMonths(now, 3)
          break
        case '6m':
          cutoffDate = subMonths(now, 6)
          break
        case '1y':
          cutoffDate = subMonths(now, 12)
          break
        default:
          cutoffDate = new Date(0)
      }

      result = result.filter(m => isAfter(parseISO(m.data), cutoffDate))
    }

    // Sort
    result.sort((a, b) => {
      const dateA = parseISO(a.data).getTime()
      const dateB = parseISO(b.data).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [measurements, filterPeriod, sortOrder])

  // Group by month
  const groupedMeasurements = useMemo(() => {
    const groups: Record<string, typeof measurements> = {}

    filteredMeasurements.forEach(m => {
      const monthKey = format(parseISO(m.data), 'MMMM yyyy', { locale: ptBR })
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(m)
    })

    return groups
  }, [filteredMeasurements])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
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

        <h1 className="text-2xl font-bold text-white">Histórico de Medições</h1>
        <p className="text-slate-400 text-sm">{stats.medicoes_total} medições registradas</p>
      </div>

      {/* Stats summary */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-4"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-slate-500 text-xs mb-1">Peso inicial</p>
              <p className="text-lg font-bold text-white">{stats.peso_inicial.toFixed(1)}kg</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Peso atual</p>
              <p className="text-lg font-bold text-white">{stats.peso_atual.toFixed(1)}kg</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Variação</p>
              <p className={cn(
                'text-lg font-bold',
                stats.peso_atual < stats.peso_inicial ? 'text-emerald-400' : 'text-amber-400'
              )}>
                {stats.peso_atual >= stats.peso_inicial ? '+' : ''}
                {(stats.peso_atual - stats.peso_inicial).toFixed(1)}kg
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-[#14141F] border border-[#2E2E3E] rounded-lg p-1">
            {(['all', '3m', '6m', '1y'] as FilterPeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  filterPeriod === period
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {period === 'all' ? 'Todos' :
                 period === '3m' ? '3 meses' :
                 period === '6m' ? '6 meses' : '1 ano'}
              </button>
            ))}
          </div>

          {/* Sort button */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-3 py-2 bg-[#14141F] border border-[#2E2E3E] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            <span className="text-xs">{sortOrder === 'desc' ? 'Recentes' : 'Antigas'}</span>
          </button>

          {/* Compare toggle */}
          <button
            onClick={() => setShowCompare(prev => !prev)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              showCompare
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-[#14141F] border-[#2E2E3E] text-slate-400'
            )}
          >
            Comparar
          </button>
        </div>
      </div>

      {/* Measurements list */}
      <div className="px-4">
        {Object.keys(groupedMeasurements).length === 0 ? (
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma medição no período selecionado</p>
          </div>
        ) : (
          Object.entries(groupedMeasurements).map(([month, monthMeasurements]) => (
            <div key={month} className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {month}
              </h3>

              <div className="space-y-3">
                {monthMeasurements.map((measurement, index) => {
                  // Find previous measurement for comparison
                  const allSorted = [...measurements].sort((a, b) =>
                    parseISO(a.data).getTime() - parseISO(b.data).getTime()
                  )
                  const currentIndex = allSorted.findIndex(m => m.id === measurement.id)
                  const previousMeasurement = currentIndex > 0 ? allSorted[currentIndex - 1] : undefined

                  return (
                    <MeasurementCard
                      key={measurement.id}
                      measurement={measurement}
                      index={index}
                      showCompare={showCompare && !!previousMeasurement}
                      previousMeasurement={previousMeasurement}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

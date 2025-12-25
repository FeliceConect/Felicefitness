"use client"

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { WaterDayTotal } from '@/lib/water/types'

interface WaterWeeklyChartProps {
  data: WaterDayTotal[]
  goal: number
}

export function WaterWeeklyChart({ data, goal }: WaterWeeklyChartProps) {
  // Encontrar máximo para escalar o gráfico
  const maxAmount = useMemo(() => {
    const max = Math.max(...data.map(d => d.total), goal)
    return Math.ceil(max / 500) * 500 // Arredondar para múltiplo de 500
  }, [data, goal])

  return (
    <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Últimos 7 dias
      </h3>

      <div className="relative">
        {/* Meta line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-cyan-500/30 z-10"
          style={{ bottom: `${(goal / maxAmount) * 100}%` }}
        >
          <span className="absolute right-0 -top-3 text-xs text-cyan-400 bg-[#14141F] px-1">
            {(goal / 1000).toFixed(1)}L
          </span>
        </div>

        {/* Chart bars */}
        <div className="flex items-end justify-between gap-2 h-40">
          {data.map((day, index) => {
            const percentage = Math.min((day.total / maxAmount) * 100, 100)
            const isGoalMet = day.total >= goal
            const date = parseISO(day.date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center"
              >
                {/* Bar */}
                <div className="w-full relative h-full flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={cn(
                      'w-full max-w-[40px] rounded-t-lg relative',
                      isGoalMet
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : percentage >= 80
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                        : 'bg-gradient-to-t from-violet-600 to-violet-400',
                      isTodayDate && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#14141F]'
                    )}
                  >
                    {/* Amount tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {day.total >= 1000
                          ? `${(day.total / 1000).toFixed(1)}L`
                          : `${day.total}ml`}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Day label */}
                <span className={cn(
                  'text-xs mt-2',
                  isTodayDate ? 'text-cyan-400 font-bold' : 'text-slate-500'
                )}>
                  {format(date, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>

                {/* Status indicator */}
                <span className="text-xs mt-0.5">
                  {isGoalMet ? '✓' : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Meta atingida</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>&gt;80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-violet-500" />
          <span>&lt;80%</span>
        </div>
      </div>
    </div>
  )
}

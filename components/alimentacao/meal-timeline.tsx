"use client"

import { motion } from 'framer-motion'
import { Plus, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Meal, PlannedMeal, MealType } from '@/lib/nutrition/types'
import { mealTypeLabels, mealTypeIcons } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

interface MealTimelineProps {
  meals: Meal[]
  plannedMeals: PlannedMeal[]
  nextMeal: PlannedMeal | null
  onAddMeal: (tipo: MealType) => void
}

export function MealTimeline({
  meals,
  plannedMeals,
  nextMeal,
  onAddMeal
}: MealTimelineProps) {
  // Merge planned and actual meals
  const timelineItems = plannedMeals.map(planned => {
    const actualMeal = meals.find(m => m.tipo === planned.tipo)
    return {
      planned,
      actual: actualMeal,
      isNext: nextMeal?.tipo === planned.tipo,
      isCompleted: actualMeal?.status === 'concluido',
      isSkipped: actualMeal?.status === 'pulado'
    }
  })

  return (
    <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Refeições
        </h3>
        <Link
          href="/alimentacao/refeicao/nova"
          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Link>
      </div>

      <div className="space-y-3">
        {timelineItems.map((item, index) => {
          const { planned, actual, isNext, isCompleted, isSkipped } = item

          // Skip optional meals that haven't been logged
          if (planned.opcional && !actual) {
            return null
          }

          return (
            <motion.div
              key={planned.tipo}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {actual ? (
                // Refeição registrada
                <Link href={`/alimentacao/refeicao/${actual.id}`}>
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-all',
                      isCompleted
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : isSkipped
                        ? 'bg-slate-800/50 border border-slate-700'
                        : 'bg-slate-800 border border-slate-700'
                    )}
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                        isCompleted
                          ? 'bg-emerald-500/20'
                          : isSkipped
                          ? 'bg-slate-700'
                          : 'bg-slate-700'
                      )}
                    >
                      {isCompleted ? '✅' : isSkipped ? '⏭️' : mealTypeIcons[planned.tipo]}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {mealTypeLabels[planned.tipo]}
                        </span>
                        {actual.horario_real && (
                          <span className="text-xs text-slate-500">
                            {actual.horario_real}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {Math.round(actual.calorias_total)} kcal • {Math.round(actual.proteinas_total)}g prot
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </Link>
              ) : (
                // Refeição planejada (não registrada ainda)
                <button
                  onClick={() => onAddMeal(planned.tipo)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                    isNext
                      ? 'bg-violet-500/10 border-2 border-violet-500/30 animate-pulse'
                      : 'bg-slate-800/30 border border-dashed border-slate-700 hover:border-violet-500/30'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                      isNext ? 'bg-violet-500/20' : 'bg-slate-800'
                    )}
                  >
                    {isNext ? '⏳' : mealTypeIcons[planned.tipo]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium',
                        isNext ? 'text-violet-400' : 'text-slate-400'
                      )}>
                        {mealTypeLabels[planned.tipo]}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {planned.horario}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {isNext ? 'Próxima refeição' : 'Planejado'}
                    </p>
                  </div>

                  <Plus className={cn(
                    'w-5 h-5',
                    isNext ? 'text-violet-400' : 'text-slate-500'
                  )} />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

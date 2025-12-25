"use client"

import { motion } from 'framer-motion'
import { MacrosRing } from './macros-ring'
import type { NutritionTotals, NutritionGoals } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

interface MacrosProgressProps {
  totals: NutritionTotals
  goals: NutritionGoals
}

export function MacrosProgress({ totals, goals }: MacrosProgressProps) {
  const caloriesProgress = (totals.calorias / goals.calorias) * 100
  const caloriesRemaining = Math.max(0, goals.calorias - totals.calorias)

  // Get color based on progress
  const getBarColor = () => {
    if (caloriesProgress < 80) return 'bg-amber-500'
    if (caloriesProgress <= 105) return 'bg-emerald-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Macros do Dia
      </h3>

      {/* Macro rings */}
      <div className="flex justify-around mb-6">
        <MacrosRing
          label="Proteína"
          current={totals.proteinas}
          goal={goals.proteinas}
          color="violet"
        />
        <MacrosRing
          label="Carboidrato"
          current={totals.carboidratos}
          goal={goals.carboidratos}
          color="cyan"
        />
        <MacrosRing
          label="Gordura"
          current={totals.gorduras}
          goal={goals.gorduras}
          color="amber"
        />
      </div>

      {/* Calories bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Calorias</span>
          <span className="text-white font-medium">
            {Math.round(totals.calorias)} / {goals.calorias} kcal
          </span>
        </div>

        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', getBarColor())}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(caloriesProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {caloriesProgress < 100
              ? `Faltam ${Math.round(caloriesRemaining)} kcal`
              : caloriesProgress > 105
              ? `Excedido em ${Math.round(totals.calorias - goals.calorias)} kcal`
              : 'Meta atingida!'}
          </span>
          <span>{Math.round(caloriesProgress)}%</span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, Flame, Calendar } from 'lucide-react'
import { formatWaterAmount } from '@/lib/water/calculations'
import { cn } from '@/lib/utils'

interface WaterStatsCardProps {
  weeklyAverage: number
  daysMetGoal: number
  currentStreak: number
  bestStreak: number
  goal: number
}

export function WaterStatsCard({
  weeklyAverage,
  daysMetGoal,
  currentStreak,
  bestStreak,
  goal
}: WaterStatsCardProps) {
  const avgPercentage = Math.round((weeklyAverage / goal) * 100)
  const isAboveGoal = weeklyAverage >= goal

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border border-cyan-500/20 rounded-2xl p-4"
    >
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Estatísticas da Semana
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Média semanal */}
        <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            {isAboveGoal ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs text-slate-500">Média diária</span>
          </div>
          <p className={cn(
            'text-xl font-bold',
            isAboveGoal ? 'text-emerald-400' : 'text-amber-400'
          )}>
            {formatWaterAmount(weeklyAverage)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {avgPercentage}% da meta
          </p>
        </div>

        {/* Dias na meta */}
        <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-500">Meta atingida</span>
          </div>
          <p className="text-xl font-bold text-white">
            {daysMetGoal}
            <span className="text-slate-500 font-normal">/7 dias</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {Math.round((daysMetGoal / 7) * 100)}% da semana
          </p>
        </div>

        {/* Streak atual */}
        <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame className={cn(
              'w-4 h-4',
              currentStreak >= 3 ? 'text-orange-400' : 'text-slate-500'
            )} />
            <span className="text-xs text-slate-500">Streak atual</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className={cn(
              'text-xl font-bold',
              currentStreak >= 3 ? 'text-orange-400' : 'text-white'
            )}>
              {currentStreak}
            </p>
            <span className="text-sm text-slate-500">dias</span>
          </div>
          {currentStreak >= 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-orange-400 mt-0.5"
            >
              Em chamas! 🔥
            </motion.p>
          )}
        </div>

        {/* Melhor streak */}
        <div className="bg-[#0A0A0F]/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-500">Melhor streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-bold text-cyan-400">
              {bestStreak}
            </p>
            <span className="text-sm text-slate-500">dias</span>
          </div>
          {currentStreak === bestStreak && currentStreak > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-cyan-400 mt-0.5"
            >
              Recorde atual! 🏆
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

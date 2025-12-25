"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ChevronRight, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  WaterProgressRing,
  WaterQuickAdd,
  WaterLogList,
  WaterStatsCard,
  CustomAmountModal,
  WaterGoalEditor
} from '@/components/agua'
import { useWaterLog } from '@/hooks/use-water-log'
import { useWaterStats } from '@/hooks/use-water-stats'
import { isOnTrack } from '@/lib/water/calculations'
import { cn } from '@/lib/utils'

export default function WaterPage() {
  const {
    logs,
    todayTotal,
    goal,
    quickAddAmounts,
    addWater,
    removeLog,
    updateGoal,
    isAdding,
    isGoalReached
  } = useWaterLog()

  const stats = useWaterStats()

  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Verificar se está no ritmo
  const currentHour = new Date().getHours()
  const trackStatus = isOnTrack(todayTotal, goal, currentHour)

  // Mostrar celebração quando atingir a meta
  const handleAddWater = async (ml: number) => {
    const newTotal = todayTotal + ml
    const success = await addWater(ml)

    if (success && newTotal >= goal && todayTotal < goal) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }

    return success
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Hidratação</h1>
          <button
            onClick={() => setShowGoalEditor(true)}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Progress Ring */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'bg-[#14141F] border rounded-2xl p-6',
            isGoalReached
              ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent'
              : 'border-[#2E2E3E]'
          )}
        >
          <div className="flex justify-center mb-6">
            <WaterProgressRing
              current={todayTotal}
              goal={goal}
              size="lg"
              showLabels
              animated
            />
          </div>

          {/* Status message */}
          <div className="text-center mb-4">
            {isGoalReached ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-cyan-400 font-medium"
              >
                Parabéns! Meta atingida! 🎉
              </motion.p>
            ) : trackStatus.onTrack ? (
              <p className="text-emerald-400 text-sm">
                Você está no ritmo! Continue assim 💪
              </p>
            ) : (
              <p className="text-amber-400 text-sm">
                Você está {Math.abs(trackStatus.diff)}ml {trackStatus.diff < 0 ? 'atrás' : 'à frente'} do esperado
              </p>
            )}
          </div>

          {/* Quick add buttons */}
          <WaterQuickAdd
            amounts={quickAddAmounts}
            onAdd={handleAddWater}
            onCustomAdd={() => setShowCustomModal(true)}
            disabled={isAdding}
          />
        </motion.div>
      </div>

      {/* Today's logs */}
      <div className="px-4 mb-6">
        <WaterLogList
          logs={logs}
          onDelete={removeLog}
          showTotal
        />
      </div>

      {/* Stats Card */}
      <div className="px-4 mb-6">
        <WaterStatsCard
          weeklyAverage={stats.weeklyAverage}
          daysMetGoal={stats.daysMetGoal}
          currentStreak={stats.currentStreak}
          bestStreak={stats.bestStreak}
          goal={goal}
        />
      </div>

      {/* View history link */}
      <div className="px-4">
        <Link href="/agua/historico">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium">Ver histórico completo</p>
                <p className="text-sm text-slate-400">Análise semanal e mensal</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        </Link>
      </div>

      {/* Custom amount modal */}
      <CustomAmountModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onConfirm={handleAddWater}
      />

      {/* Goal editor modal */}
      <WaterGoalEditor
        isOpen={showGoalEditor}
        currentGoal={goal}
        onClose={() => setShowGoalEditor(false)}
        onSave={updateGoal}
      />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-8 py-4 rounded-2xl shadow-2xl"
            >
              <p className="text-2xl font-bold text-center">
                🎉 Meta Atingida! 🎉
              </p>
              <p className="text-center text-white/80 mt-1">
                Você bebeu {(goal / 1000).toFixed(1)}L de água hoje!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

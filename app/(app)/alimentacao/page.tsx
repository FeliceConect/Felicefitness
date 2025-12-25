"use client"

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Calendar, TrendingUp, Droplets, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { MacrosProgress } from '@/components/alimentacao/macros-progress'
import { RevoladeAlert } from '@/components/alimentacao/revolade-alert'
import { MealTimeline } from '@/components/alimentacao/meal-timeline'
import { useDailyMeals } from '@/hooks/use-daily-meals'
import { useRevoladeWindow } from '@/hooks/use-revolade-window'
import { useWaterLog } from '@/hooks/use-water-log'
import type { MealType } from '@/lib/nutrition/types'

export default function AlimentacaoPage() {
  const router = useRouter()
  const { meals, plannedMeals, totals, goals, progress, nextMeal, loading } = useDailyMeals()
  const revoladeWindow = useRevoladeWindow()
  const { todayTotal: aguaConsumida } = useWaterLog()

  const handleAddMeal = (tipo: MealType) => {
    router.push(`/alimentacao/refeicao/nova?tipo=${tipo}`)
  }

  // Meta de água do perfil
  const aguaMeta = 3000

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Alimentação</h1>
          <Link
            href="/alimentacao/historico"
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            Histórico
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        </div>
      </div>

      {/* Revolade Alert */}
      {revoladeWindow.alertType !== 'none' && (
        <div className="px-4 mb-4">
          <RevoladeAlert window={revoladeWindow} />
        </div>
      )}

      {/* Macros Progress */}
      <div className="px-4 mb-6">
        <MacrosProgress totals={totals} goals={goals} />
      </div>

      {/* Water intake quick view */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Água</p>
                <p className="text-lg font-bold text-white">
                  {(aguaConsumida / 1000).toFixed(1)}L / {(aguaMeta / 1000).toFixed(1)}L
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-cyan-400">
                {Math.round((aguaConsumida / aguaMeta) * 100)}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((aguaConsumida / aguaMeta) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Meal Timeline */}
      <div className="px-4 mb-6">
        <MealTimeline
          meals={meals}
          plannedMeals={plannedMeals}
          nextMeal={nextMeal}
          onAddMeal={handleAddMeal}
        />
      </div>

      {/* AI Analyzer Quick Access */}
      <div className="px-4 mb-6">
        <Link href="/alimentacao/analisar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Analisar Refeição com IA</p>
                <p className="text-slate-400 text-sm">Tire uma foto e a IA calcula os macros</p>
              </div>
              <ChevronRight className="w-5 h-5 text-violet-400" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link href="/alimentacao/alimento">
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍎</span>
                <div>
                  <p className="text-white font-medium">Alimentos</p>
                  <p className="text-sm text-slate-400">Banco de alimentos</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/alimentacao/historico">
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-white font-medium">Análise</p>
                  <p className="text-sm text-slate-400">Ver tendências</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Daily summary */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Resumo do Dia
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Refeições</p>
              <p className="text-xl font-bold text-white">
                {meals.filter(m => m.status === 'concluido').length}/{plannedMeals.filter(p => !p.opcional).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Proteína</p>
              <p className="text-xl font-bold text-violet-400">
                {Math.round(progress.proteinas)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Calorias restantes</p>
              <p className="text-xl font-bold text-white">
                {Math.max(0, goals.calorias - totals.calorias)} kcal
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Meta diária</p>
              <p className="text-xl font-bold text-emerald-400">
                {progress.calorias >= 80 && progress.calorias <= 105 ? '✓' : `${Math.round(progress.calorias)}%`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

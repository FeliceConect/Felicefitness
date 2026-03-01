"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/shared'
import { formatCalories, formatGrams } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { TodayMeal } from '@/hooks/use-dashboard-data'

interface MealsCardProps {
  meals: TodayMeal[]
  totalCalorias: number
  metaCalorias: number
  totalProteinas: number
  metaProteinas: number
}

const mealLabels: Record<string, { label: string; icon: string }> = {
  cafe_manha: { label: 'Café da manhã', icon: '☕' },
  lanche_manha: { label: 'Lanche manhã', icon: '🍎' },
  almoco: { label: 'Almoço', icon: '🍽️' },
  lanche_tarde: { label: 'Lanche tarde', icon: '🥤' },
  jantar: { label: 'Jantar', icon: '🍲' },
  ceia: { label: 'Ceia', icon: '🌙' }
}

export function MealsCard({
  meals,
  totalCalorias,
  metaCalorias,
  totalProteinas,
  metaProteinas
}: MealsCardProps) {
  const router = useRouter()

  const caloriasProgress = metaCalorias > 0 ? totalCalorias / metaCalorias : 0
  const proteinasProgress = metaProteinas > 0 ? totalProteinas / metaProteinas : 0

  // Encontrar próxima refeição pendente
  const nextMealIndex = meals.findIndex(m => m.status === 'pendente')

  const handleMealClick = (tipo: string) => {
    router.push(`/alimentacao/refeicao/nova?tipo=${tipo}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-white border border-border rounded-2xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🍽️</span>
        <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
          Alimentação
        </h3>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground-secondary">Calorias</span>
            <span className="text-foreground">
              {formatCalories(totalCalorias)} / {formatCalories(metaCalorias)}
            </span>
          </div>
          <ProgressBar progress={caloriasProgress} height={6} />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground-secondary">Proteína</span>
            <span className="text-foreground">
              {formatGrams(totalProteinas)} / {formatGrams(metaProteinas)}
            </span>
          </div>
          <ProgressBar progress={proteinasProgress} height={6} color="#663739" />
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-1.5">
        {meals.slice(0, 4).map((meal, index) => {
          const mealInfo = mealLabels[meal.tipo] || { label: meal.tipo, icon: '🍴' }
          const isNext = index === nextMealIndex
          const isCompleted = meal.status === 'concluido'

          return (
            <motion.button
              key={meal.tipo}
              onClick={() => handleMealClick(meal.tipo)}
              className={cn(
                'w-full flex items-center justify-between py-1.5 px-2 rounded-lg',
                'transition-colors duration-200',
                isNext && 'bg-warning/10 border border-warning/30',
                isCompleted && 'opacity-70',
                !isNext && !isCompleted && 'hover:bg-background-elevated'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm',
                  isNext && 'animate-pulse'
                )}>
                  {isCompleted ? '✅' : isNext ? '⏳' : '○'}
                </span>
                <span className={cn(
                  'text-sm',
                  isCompleted ? 'text-foreground-muted' : 'text-foreground'
                )}>
                  {mealInfo.label}
                </span>
              </div>
              {meal.horario && (
                <span className="text-xs text-foreground-muted">
                  {meal.horario}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Ver mais */}
      {meals.length > 4 && (
        <button
          onClick={() => router.push('/alimentacao')}
          className="w-full text-center text-xs text-dourado hover:text-dourado/80 mt-2 py-1"
        >
          Ver todas as refeições
        </button>
      )}
    </motion.div>
  )
}

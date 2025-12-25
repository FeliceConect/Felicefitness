'use client'

import { useSupplements } from '@/hooks/use-supplements'
import { useSupplementStock } from '@/hooks/use-supplement-stock'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  NextDoseCard,
  DailySupplements,
  SupplementCard,
  StockAlert,
  ProgressRing,
} from '@/components/supplements'
import { Plus, Package, History } from 'lucide-react'
import Link from 'next/link'

export default function SupplementosPage() {
  const {
    supplements,
    schedule,
    dailyProgress,
    nextDose,
    isLoading,
    markDose,
  } = useSupplements()

  const { lowStockItems } = useSupplementStock()

  const handleMarkTaken = async (supplementId: string, time: string) => {
    try {
      await markDose(supplementId, time, true)
    } catch (error) {
      console.error('Error marking dose:', error)
    }
  }

  const handleToggleTaken = async (supplementId: string, time: string, taken: boolean) => {
    try {
      await markDose(supplementId, time, taken)
    } catch (error) {
      console.error('Error toggling dose:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Suplementos" showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Suplementos"
        showBack
        rightContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/suplementos/historico">
                <History className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/suplementos/estoque">
                <Package className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        }
      />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Daily Progress Ring */}
        <div className="flex items-center justify-center py-4">
          <ProgressRing progress={dailyProgress.percent} size={140}>
            <div className="text-center">
              <p className="text-3xl font-bold">{dailyProgress.percent}%</p>
              <p className="text-sm text-muted-foreground">
                {dailyProgress.taken}/{dailyProgress.total}
              </p>
            </div>
          </ProgressRing>
        </div>

        {/* Stock Alert */}
        {lowStockItems.length > 0 && (
          <StockAlert stockLevels={lowStockItems} />
        )}

        {/* Next Dose Card */}
        <NextDoseCard
          nextDose={nextDose}
          onMarkTaken={handleMarkTaken}
        />

        {/* Daily Schedule */}
        <DailySupplements
          schedule={schedule}
          onToggleTaken={handleToggleTaken}
        />

        {/* All Supplements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Meus Suplementos</h2>
            <Button size="sm" asChild>
              <Link href="/suplementos/novo">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {supplements.map(supplement => {
              const supplementSchedule = schedule.filter(
                s => s.supplement.id === supplement.id
              )
              return (
                <SupplementCard
                  key={supplement.id}
                  supplement={supplement}
                  schedules={supplementSchedule}
                />
              )
            })}

            {supplements.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum suplemento cadastrado
                </p>
                <Button asChild>
                  <Link href="/suplementos/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro suplemento
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

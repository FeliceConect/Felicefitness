'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupplements } from '@/hooks/use-supplements'
import { useSupplementHistory } from '@/hooks/use-supplement-history'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplementDetail } from '@/components/supplements'
import type { Supplement } from '@/types/supplements'
import { Trash2 } from 'lucide-react'

export default function SupplementoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { supplements, schedule, deleteSupplement } = useSupplements()
  const { adherenceBySuplement } = useSupplementHistory()
  const [supplement, setSupplement] = useState<Supplement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const found = supplements.find(s => s.id === id)
    if (found) {
      setSupplement(found)
      setIsLoading(false)
    } else if (supplements.length > 0) {
      // Supplement not found after loading
      setIsLoading(false)
    }
  }, [supplements, id])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este suplemento?')) return

    try {
      setIsDeleting(true)
      await deleteSupplement(id)
      router.push('/suplementos')
    } catch (error) {
      console.error('Error deleting supplement:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Carregando..." showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!supplement) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Não encontrado" showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-24">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Suplemento não encontrado</p>
            <Button className="mt-4" onClick={() => router.push('/suplementos')}>
              Voltar
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const todaySchedule = schedule.filter(s => s.supplement.id === id)
  const adherence = adherenceBySuplement[id]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={supplement.nome}
        showBack
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        }
      />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-24">
        <SupplementDetail
          supplement={supplement}
          todaySchedule={todaySchedule}
          adherenceRate={adherence}
        />
      </main>

      <BottomNav />
    </div>
  )
}

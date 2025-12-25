'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupplements } from '@/hooks/use-supplements'
import { AppHeader } from '@/components/layout/app-header'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplementForm } from '@/components/supplements'
import type { Supplement, NewSupplement } from '@/types/supplements'

export default function EditarSupplementoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { supplements, updateSupplement } = useSupplements()
  const [supplement, setSupplement] = useState<Supplement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const found = supplements.find(s => s.id === id)
    if (found) {
      setSupplement(found)
      setIsLoading(false)
    } else if (supplements.length > 0) {
      setIsLoading(false)
    }
  }, [supplements, id])

  const handleSubmit = async (data: NewSupplement) => {
    try {
      setIsSaving(true)
      await updateSupplement(id, data)
      router.push(`/suplementos/${id}`)
    } catch (error) {
      console.error('Error updating supplement:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Carregando..." showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-8 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    )
  }

  if (!supplement) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Não encontrado" showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Suplemento não encontrado</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Editar Suplemento" showBack />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-8">
        <SupplementForm
          supplement={supplement}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isSaving}
        />
      </main>
    </div>
  )
}

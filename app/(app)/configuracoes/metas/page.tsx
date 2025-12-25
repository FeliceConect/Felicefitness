'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalsForm } from '@/components/settings'
import { useGoals } from '@/hooks/use-goals'
import { validateGoals } from '@/lib/settings/validators'
import { toast } from 'sonner'
import type { Goals } from '@/types/settings'

export default function MetasPage() {
  const router = useRouter()
  const { goals, recommendations, progress, loading, updateGoals } = useGoals()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (newGoals: Goals) => {
    // Validate
    const validation = validateGoals(newGoals)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})

    try {
      await updateGoals(newGoals)
      toast.success('Metas salvas com sucesso!')
      router.back()
    } catch {
      toast.error('Erro ao salvar metas')
    }
  }

  if (loading || !goals) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Metas</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Metas</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <GoalsForm
          initialValues={goals}
          recommendations={recommendations}
          progress={progress || undefined}
          onSubmit={handleSubmit}
          errors={errors}
        />
      </div>
    </div>
  )
}

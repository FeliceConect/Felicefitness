'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkoutPreferencesForm } from '@/components/settings'
import { useSettings } from '@/hooks/use-settings'
import { validateWorkoutPreferences } from '@/lib/settings/validators'
import { toast } from 'sonner'
import type { WorkoutPreferences } from '@/types/settings'

export default function TreinoPrefsPage() {
  const router = useRouter()
  const { settings, loading, updateWorkoutPreferences } = useSettings()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (newPrefs: WorkoutPreferences) => {
    // Validate
    const validation = validateWorkoutPreferences(newPrefs)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})

    try {
      await updateWorkoutPreferences(newPrefs)
      toast.success('Preferências de treino salvas!')
      router.back()
    } catch {
      toast.error('Erro ao salvar preferências')
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Preferências de Treino</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
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
          <h1 className="font-semibold">Preferências de Treino</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <WorkoutPreferencesForm
          preferences={settings.workout}
          onSubmit={handleSubmit}
          errors={errors}
        />
      </div>
    </div>
  )
}

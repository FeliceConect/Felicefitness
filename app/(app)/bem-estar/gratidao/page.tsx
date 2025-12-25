'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { useGratitude } from '@/hooks/use-gratitude'
import {
  GratitudeInput,
  GratitudeList,
  GratitudeHistory,
  GratitudeStats,
} from '@/components/wellness'

export default function GratitudePage() {
  const gratitude = useGratitude()

  if (gratitude.loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/bem-estar">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Diário de Gratidão</h1>
          <p className="text-sm text-muted-foreground">
            Cultive gratidão diariamente
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
        <div className="flex gap-3">
          <span className="text-2xl">🙏</span>
          <div>
            <p className="font-medium text-pink-700 dark:text-pink-400">
              Por que praticar gratidão?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Estudos mostram que registrar 3 coisas pelas quais você é grato
              diariamente aumenta a felicidade e reduz sintomas de depressão.
            </p>
          </div>
        </div>
      </div>

      {/* Today's entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GratitudeInput
            onAdd={gratitude.addEntry}
            canAddMore={gratitude.canAddMore}
          />

          {gratitude.todayEntries.length > 0 && (
            <GratitudeList
              entries={gratitude.todayEntries}
              onRemove={gratitude.removeEntry}
              editable
            />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <GratitudeStats
        streak={gratitude.gratitudeStreak}
        totalEntries={gratitude.totalEntries}
        frequentThemes={gratitude.frequentThemes}
      />

      {/* History */}
      {gratitude.recentEntries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium">Gratidões Recentes</h2>
          <GratitudeHistory history={gratitude.recentEntries.slice(0, 7)} />
        </div>
      )}
    </div>
  )
}

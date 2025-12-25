'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { MEDITATIONS, getCategoryLabel, getCategoryIcon } from '@/lib/wellness/meditations'
import { useMeditation } from '@/hooks/use-meditation'
import {
  MeditationCard,
  MeditationStats,
  MeditationPlayer,
  MeditationComplete,
} from '@/components/wellness'
import type { Meditation, MeditationCategory } from '@/types/wellness'

export default function MeditationPage() {
  const meditation = useMeditation()
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(
    null
  )
  const [showComplete, setShowComplete] = useState(false)
  const [completedDuration, setCompletedDuration] = useState(0)

  // Group meditations by category
  const categories: MeditationCategory[] = [
    'morning',
    'focus',
    'relax',
    'gratitude',
    'sleep',
  ]

  const handleStartMeditation = (m: Meditation) => {
    setSelectedMeditation(m)
    setShowComplete(false)
  }

  const handleComplete = () => {
    if (selectedMeditation) {
      setCompletedDuration(selectedMeditation.duration * 60)
      setShowComplete(true)
    }
  }

  const handleExit = () => {
    setSelectedMeditation(null)
    setShowComplete(false)
  }

  const handleCloseComplete = () => {
    setShowComplete(false)
    setSelectedMeditation(null)
  }

  if (showComplete && selectedMeditation) {
    return (
      <MeditationComplete
        meditation={selectedMeditation}
        duration={completedDuration}
        onClose={handleCloseComplete}
      />
    )
  }

  if (selectedMeditation) {
    return (
      <MeditationPlayer
        meditation={selectedMeditation}
        onComplete={handleComplete}
        onExit={handleExit}
      />
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
          <h1 className="text-xl font-bold">Meditação</h1>
          <p className="text-sm text-muted-foreground">
            Encontre paz e clareza mental
          </p>
        </div>
      </div>

      {/* Stats */}
      <MeditationStats
        sessionsThisWeek={meditation.sessionsThisWeek}
        minutesThisWeek={meditation.totalMinutesThisWeek}
      />

      {/* Recommended */}
      {meditation.suggestedMeditation && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recomendado para você
          </h2>
          <MeditationCard
            meditation={meditation.suggestedMeditation}
            onStart={() => handleStartMeditation(meditation.suggestedMeditation!)}
            recommended
          />
        </div>
      )}

      {/* Meditations by category */}
      {categories.map((category) => {
        const categoryMeditations = MEDITATIONS.filter(
          (m) => m.category === category
        )
        if (categoryMeditations.length === 0) return null

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryIcon(category)}</span>
              <h2 className="font-medium">{getCategoryLabel(category)}</h2>
            </div>

            {categoryMeditations.map((m) => (
              <MeditationCard
                key={m.id}
                meditation={m}
                onStart={() => handleStartMeditation(m)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

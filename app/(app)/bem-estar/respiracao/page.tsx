'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { BREATHING_PATTERNS } from '@/lib/wellness/breathing-patterns'
import {
  BreathingExerciseCard,
  BreathingPlayer,
} from '@/components/wellness'
import type { BreathingPattern } from '@/types/wellness'

export default function BreathingPage() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(
    null
  )

  if (selectedPattern) {
    return (
      <BreathingPlayer
        pattern={selectedPattern}
        onClose={() => setSelectedPattern(null)}
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
          <h1 className="text-xl font-bold">Exercícios de Respiração</h1>
          <p className="text-sm text-muted-foreground">
            Escolha um exercício para começar
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex gap-3">
          <span className="text-2xl">🧘</span>
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-400">
              Benefícios da respiração consciente
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Reduz stress, melhora o foco, acalma a mente e ajuda no sono. Apenas
              alguns minutos por dia fazem diferença.
            </p>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {BREATHING_PATTERNS.map((pattern) => (
          <BreathingExerciseCard
            key={pattern.id}
            pattern={pattern}
            onSelect={() => setSelectedPattern(pattern)}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Save, Loader2 } from 'lucide-react'
import { useWellness } from '@/hooks/use-wellness'
import {
  MoodSelector,
  StressLevelInput,
  EnergyLevelInput,
  MoodFactorsInput,
} from '@/components/wellness'
import { getMoodLevel } from '@/lib/wellness/moods'
import { useToast } from '@/hooks/use-toast'

export default function CheckinPage() {
  const router = useRouter()
  const wellness = useWellness()
  const { toast } = useToast()

  const [mood, setMood] = useState<number>(wellness.todayCheckin?.humor || 3)
  const [stress, setStress] = useState<number>(wellness.todayCheckin?.stress || 3)
  const [energy, setEnergy] = useState<number | null>(
    wellness.todayCheckin?.energia || null
  )
  const [positiveFactors, setPositiveFactors] = useState<string[]>(
    wellness.todayCheckin?.fatoresPositivos || []
  )
  const [negativeFactors, setNegativeFactors] = useState<string[]>(
    wellness.todayCheckin?.fatoresNegativos || []
  )
  const [notes, setNotes] = useState<string>(wellness.todayCheckin?.notas || '')
  const [saving, setSaving] = useState(false)

  const currentMood = getMoodLevel(mood)

  const handleSave = async () => {
    if (energy === null) {
      toast({
        title: 'Selecione seu nível de energia',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await wellness.submitCheckin({
        mood,
        stress,
        energy,
        positiveFactors,
        negativeFactors,
        notes: notes.trim() || undefined,
      })

      toast({
        title: 'Check-in salvo!',
        description: 'Seu bem-estar foi registrado com sucesso.',
      })

      router.push('/bem-estar')
    } catch (error) {
      console.error('Error saving check-in:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bem-estar">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Check-in</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>

      {/* Mood selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como você está se sentindo?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodSelector value={mood} onChange={setMood} size="lg" />
          {currentMood && (
            <div className="text-center">
              <p
                className="text-lg font-medium"
                style={{ color: currentMood.color }}
              >
                {currentMood.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentMood.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stress level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nível de Stress</CardTitle>
        </CardHeader>
        <CardContent>
          <StressLevelInput value={stress} onChange={setStress} />
        </CardContent>
      </Card>

      {/* Energy level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nível de Energia</CardTitle>
        </CardHeader>
        <CardContent>
          <EnergyLevelInput value={energy} onChange={setEnergy} />
        </CardContent>
      </Card>

      {/* Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O que influenciou seu dia?</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodFactorsInput
            positiveFactors={positiveFactors}
            negativeFactors={negativeFactors}
            onPositiveChange={setPositiveFactors}
            onNegativeChange={setNegativeFactors}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notas (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi seu dia? Algo importante aconteceu?"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save button (bottom) */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12 gap-2">
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        Salvar Check-in
      </Button>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useRecovery } from '@/hooks/use-recovery'
import { useSleep } from '@/hooks/use-sleep'
import {
  EnergyLevelInput,
  MoodSelector,
  StressLevelInput,
  SorenessMap,
  ReadinessGauge,
  RecoveryScoreDisplay,
} from '@/components/recovery'
import { calculateRecoveryScore, calculateRecoveryComponents } from '@/lib/sleep/calculations'
import type { SorenessArea } from '@/types/sleep'
import { toast } from 'sonner'

export default function CheckinPage() {
  const router = useRouter()
  const { submitCheckin, todayCheckin } = useRecovery()
  const { lastSleep } = useSleep(7)

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  const [saving, setSaving] = useState(false)
  const [energyLevel, setEnergyLevel] = useState(todayCheckin?.energy_level || 3)
  const [mood, setMood] = useState(todayCheckin?.mood || 3)
  const [stressLevel, setStressLevel] = useState(todayCheckin?.stress_level || 2)
  const [sorenessAreas, setSorenessAreas] = useState<SorenessArea[]>(
    todayCheckin?.soreness_areas || []
  )
  const [trainingReadiness, setTrainingReadiness] = useState(
    todayCheckin?.training_readiness || 3
  )
  const [notes, setNotes] = useState(todayCheckin?.notes || '')

  // Calculate preview score
  const avgSoreness = sorenessAreas.length > 0
    ? sorenessAreas.reduce((sum, a) => sum + a.intensity, 0) / sorenessAreas.length
    : 1

  const previewScore = calculateRecoveryScore({
    sleepDuration: lastSleep?.duration || 0,
    sleepQuality: lastSleep?.quality || 3,
    energyLevel,
    stressLevel,
    sorenessLevel: Math.min(5, Math.round(avgSoreness * 1.67)),
    sleepGoal: 7,
  })

  const previewComponents = calculateRecoveryComponents(
    lastSleep || null,
    {
      id: '',
      user_id: '',
      date: dateStr,
      energy_level: energyLevel,
      mood,
      stress_level: stressLevel,
      soreness_areas: sorenessAreas,
      training_readiness: trainingReadiness,
      recovery_score: previewScore,
      created_at: '',
    },
    7
  )

  // Initialize from existing check-in
  useEffect(() => {
    if (todayCheckin) {
      setEnergyLevel(todayCheckin.energy_level)
      setMood(todayCheckin.mood)
      setStressLevel(todayCheckin.stress_level)
      setSorenessAreas(todayCheckin.soreness_areas)
      setTrainingReadiness(todayCheckin.training_readiness)
      setNotes(todayCheckin.notes || '')
    }
  }, [todayCheckin])

  const handleSave = async () => {
    setSaving(true)
    try {
      await submitCheckin({
        date: dateStr,
        energy_level: energyLevel,
        mood,
        stress_level: stressLevel,
        soreness_areas: sorenessAreas,
        training_readiness: trainingReadiness,
        notes: notes || undefined,
      })

      toast.success('Check-in salvo com sucesso!')
      router.push('/recuperacao')
    } catch (err) {
      console.error('Error saving check-in:', err)
      toast.error('Erro ao salvar check-in')
    } finally {
      setSaving(false)
    }
  }

  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const dateDisplay = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Check-in Matinal</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Greeting */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-xl font-medium">{greeting}! ☀️</p>
            <p className="text-sm text-muted-foreground capitalize mt-1">{dateDisplay}</p>
            <p className="text-muted-foreground mt-2">Como você está se sentindo?</p>
          </CardContent>
        </Card>

        {/* Energy Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nível de Energia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Como está sua energia agora?
            </p>
            <EnergyLevelInput value={energyLevel} onChange={setEnergyLevel} />
          </CardContent>
        </Card>

        {/* Mood */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Humor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Como está seu humor?
            </p>
            <MoodSelector value={mood} onChange={setMood} />
          </CardContent>
        </Card>

        {/* Stress Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nível de Stress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Qual seu nível de stress?
            </p>
            <StressLevelInput value={stressLevel} onChange={setStressLevel} />
          </CardContent>
        </Card>

        {/* Soreness Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dores Musculares</CardTitle>
          </CardHeader>
          <CardContent>
            <SorenessMap
              selectedAreas={sorenessAreas}
              onChange={setSorenessAreas}
            />
          </CardContent>
        </Card>

        {/* Training Readiness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Prontidão para Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Quão pronto você se sente para treinar?
            </p>
            <ReadinessGauge value={trainingReadiness} onChange={setTrainingReadiness} />
          </CardContent>
        </Card>

        {/* Preview Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score de Recuperação</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryScoreDisplay
              score={previewScore}
              components={previewComponents}
              size="md"
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
              placeholder="Observações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Salvar Check-in
        </Button>
      </div>
    </div>
  )
}

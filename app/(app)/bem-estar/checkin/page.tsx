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
import { toast as sonnerToast } from 'sonner'
import { QuickShare } from '@/components/share/quick-share'
import { getLevelFromXP, getLevelEmoji } from '@/lib/gamification/level-system'
import { createClient } from '@/lib/supabase/client'
import type { CheckinShareData } from '@/types/share'

export default function CheckinPage() {
  const router = useRouter()
  const wellness = useWellness()

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
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState<CheckinShareData | null>(null)

  const currentMood = getMoodLevel(mood)

  const handleSave = async () => {
    if (energy === null) {
      sonnerToast.error('Selecione seu nível de energia')
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

      // Fetch real user stats for share card
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let journeyDays = 1
      let streak = 1
      let totalXp = 0
      let treino = false
      let nutricao = false
      let hidratacao = false
      let sono = false
      let todayScore: number | undefined

      if (user) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('current_streak, total_xp, join_date')
          .eq('user_id', user.id)
          .single() as { data: { current_streak: number; total_xp: number; join_date: string } | null }

        if (stats?.join_date) {
          const joinDate = new Date(stats.join_date)
          const now = new Date()
          journeyDays = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        }
        streak = stats?.current_streak || 1
        totalXp = stats?.total_xp || 0

        const today = new Date().toISOString().split('T')[0]
        const { data: dayLog } = await supabase
          .from('fitness_daily_logs')
          .select('workout_completed, meals_logged, water_consumed, water_goal, sleep_logged, daily_score')
          .eq('user_id', user.id)
          .eq('date', today)
          .single() as { data: { workout_completed: boolean; meals_logged: number; water_consumed: number; water_goal: number; sleep_logged: boolean; daily_score: number } | null }

        treino = dayLog?.workout_completed || false
        nutricao = (dayLog?.meals_logged || 0) > 0
        hidratacao = (dayLog?.water_consumed || 0) >= (dayLog?.water_goal || 2000)
        sono = dayLog?.sleep_logged || false
        todayScore = dayLog?.daily_score
      }

      const level = getLevelFromXP(totalXp)
      setShareData({
        journeyDays,
        streak,
        treino,
        nutricao,
        hidratacao,
        sono,
        level: level.level,
        levelName: level.name,
        levelEmoji: getLevelEmoji(level),
        todayScore,
      })

      sonnerToast.success('Check-in salvo!')
      setShowShare(true)
    } catch (error) {
      console.error('Error saving check-in:', error)
      sonnerToast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    {/* Quick Share overlay after check-in */}
    {showShare && shareData && (
      <QuickShare
        type="checkin"
        data={shareData}
        onClose={() => {
          setShowShare(false)
          router.push('/dashboard')
        }}
        title="Check-in concluído!"
        subtitle="Compartilhe sua jornada wellness"
      />
    )}
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
    </>
  )
}

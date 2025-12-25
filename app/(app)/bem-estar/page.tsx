'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Wind,
  Brain,
  Heart,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { useWellness } from '@/hooks/use-wellness'
import { useMoodTracking } from '@/hooks/use-mood-tracking'
import {
  MoodSelector,
  WellnessScore,
  WellnessStreak,
  MoodHistoryChart,
  MoodTrendIndicator,
} from '@/components/wellness'
import { getRandomTip } from '@/lib/wellness/tips'

export default function WellnessPage() {
  const router = useRouter()
  const wellness = useWellness()
  const moodTracking = useMoodTracking()
  const [tip] = useState(() => getRandomTip())

  const handleQuickMood = async (mood: number) => {
    try {
      await moodTracking.logMood(mood)
      router.push('/bem-estar/checkin')
    } catch (error) {
      console.error('Error logging mood:', error)
    }
  }

  if (wellness.loading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Bem-estar</h1>
        </div>
        <Link href="/bem-estar/insights">
          <Button variant="ghost" size="icon">
            <BarChart3 className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Quick mood check-in */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Como você está?</span>
            {moodTracking.todayMood && (
              <MoodTrendIndicator trend={moodTracking.trend} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodSelector
            value={moodTracking.todayMood}
            onChange={handleQuickMood}
            size="lg"
          />
          <Link href="/bem-estar/checkin">
            <Button variant="outline" className="w-full gap-2">
              Fazer check-in completo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Wellness score */}
      {wellness.todayScore !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seu Score de Bem-estar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <WellnessScore
                score={wellness.todayScore}
                components={
                  wellness.todayCheckin
                    ? {
                        mood: wellness.todayCheckin.humor,
                        stress: wellness.todayCheckin.stress,
                        energy: wellness.todayCheckin.energia,
                        sleep: 70, // Default
                      }
                    : undefined
                }
                size="md"
              />
            </div>

            {/* Streak */}
            <div className="flex justify-center mt-4">
              <WellnessStreak streak={wellness.checkinStreak} size="sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/bem-estar/respiracao">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Wind className="h-6 w-6 text-blue-500" />
              </div>
              <span className="font-medium">Respirar</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bem-estar/meditacao">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-500" />
              </div>
              <span className="font-medium">Meditar</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bem-estar/gratidao">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <span className="font-medium">Gratidão</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bem-estar/historico">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <span className="font-medium">Histórico</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mood history chart */}
      <MoodHistoryChart data={moodTracking.weekMoods} />

      {/* Wellness tip */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Dica de Bem-estar</p>
              <p className="text-sm text-muted-foreground">{tip.text}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights link */}
      <Link href="/bem-estar/insights">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ver Insights</p>
                <p className="text-sm text-muted-foreground">
                  Descubra padrões e correlações
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

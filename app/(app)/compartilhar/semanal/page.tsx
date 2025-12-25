'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, WeeklyShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CompartilharSemanalPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('gradient')
  const [formatType, setFormatType] = useState<ShareFormat>('square')
  const [showDate, setShowDate] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadWeeklyData()
  }, [])

  const loadWeeklyData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get last week's data
    const now = new Date()
    const lastWeek = subWeeks(now, 1)
    const weekStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })

    // Get completed workouts for the week
    const { data: workouts } = await supabase
      .from('workout_sessions')
      .select('duration_minutes, sets_count, calories_burned, prs_count')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', weekEnd.toISOString()) as { data: {
        duration_minutes: number
        sets_count: number
        calories_burned: number
        prs_count: number
      }[] | null }

    // Get planned workouts from user settings or default
    const workoutsPlanned = 5 // Default, could be fetched from user settings

    if (workouts) {
      const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const totalDuration = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`

      const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
      const totalSets = workouts.reduce((sum, w) => sum + (w.sets_count || 0), 0)
      const prsSet = workouts.reduce((sum, w) => sum + (w.prs_count || 0), 0)

      // Generate highlights based on performance
      const highlights: string[] = []
      if (workouts.length >= workoutsPlanned) highlights.push('Meta atingida!')
      if (prsSet > 0) highlights.push(`${prsSet} PRs batidos`)
      if (totalCalories > 2000) highlights.push('Queima intensa!')

      setWeeklyData({
        workoutsCompleted: workouts.length,
        workoutsPlanned,
        totalDuration,
        totalCalories,
        totalSets,
        prsSet,
        weekStart: format(weekStart, "d 'de' MMM", { locale: ptBR }),
        weekEnd: format(weekEnd, "d 'de' MMM", { locale: ptBR }),
        highlights,
        userName: user.user_metadata?.name || 'Atleta',
      })
    }
    setLoading(false)
  }

  const handleShare = async () => {
    if (!weeklyData) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `felicefit-semanal.png`, { type: 'image/png' })
        const text = generateShareText('weekly', weeklyData as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'FeliceFit',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `felicefit-semanal-${Date.now()}.png`)
        }
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)
      if (blob) {
        downloadImage(blob, `felicefit-semanal-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!weeklyData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="container flex items-center gap-4 h-14 px-4">
            <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Sem dados da semana</h1>
          </div>
        </header>
        <main className="container px-4 py-12 text-center text-muted-foreground">
          <p>Nenhum treino registrado na semana passada</p>
          <p className="text-sm mt-1">
            Complete treinos para gerar seu resumo semanal
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Resumo Semanal</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="transform scale-[0.55] origin-top">
            <SharePreview
              ref={previewRef}
              type="weekly"
              data={weeklyData}
              theme={theme}
              format={formatType}
              showDate={showDate}
            />
          </div>
        </div>

        {/* Customizer */}
        <div className="bg-muted/30 rounded-xl p-4">
          <CardCustomizer
            theme={theme}
            format={formatType}
            onThemeChange={setTheme}
            onFormatChange={setFormatType}
            showDate={showDate}
            onShowDateChange={setShowDate}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isSharing}
            className={cn(
              'flex-1 py-3 rounded-xl font-semibold border',
              'hover:bg-muted transition-colors',
              isSharing && 'opacity-50 cursor-not-allowed'
            )}
          >
            Baixar
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={cn(
              'flex-1 py-3 rounded-xl font-semibold',
              'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
              isSharing && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSharing ? 'Gerando...' : 'Compartilhar'}
          </button>
        </div>
      </main>
    </div>
  )
}

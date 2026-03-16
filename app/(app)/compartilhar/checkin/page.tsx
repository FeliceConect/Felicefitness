'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, CheckinShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'
import { getLevelFromXP, getLevelEmoji } from '@/lib/gamification/level-system'

export default function CompartilharCheckinPage() {
  const [checkinData, setCheckinData] = useState<CheckinShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('power')
  const [format, setFormat] = useState<ShareFormat>('square')
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadCheckinData()
  }, [])

  const loadCheckinData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Load user stats for streak/journey and XP
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_streak, best_streak, total_xp, join_date')
      .eq('user_id', user.id)
      .single() as { data: { current_streak: number; best_streak: number; total_xp: number; join_date: string } | null }

    // Load today's activity data
    const today = new Date().toISOString().split('T')[0]
    const { data: dayLog } = await supabase
      .from('fitness_daily_logs')
      .select('workout_completed, meals_logged, water_consumed, water_goal, sleep_logged, checkin_done, daily_score')
      .eq('user_id', user.id)
      .eq('date', today)
      .single() as { data: { workout_completed: boolean; meals_logged: number; water_consumed: number; water_goal: number; sleep_logged: boolean; checkin_done: boolean; daily_score: number } | null }

    // Calculate journey days from join date
    let journeyDays = 1
    if (stats?.join_date) {
      const joinDate = new Date(stats.join_date)
      const now = new Date()
      journeyDays = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }

    // Get level from XP
    const level = getLevelFromXP(stats?.total_xp || 0)

    setCheckinData({
      journeyDays,
      streak: stats?.current_streak || 0,
      treino: dayLog?.workout_completed || false,
      nutricao: (dayLog?.meals_logged || 0) > 0,
      hidratacao: (dayLog?.water_consumed || 0) >= (dayLog?.water_goal || 2000),
      sono: dayLog?.sleep_logged || false,
      level: level.level,
      levelName: level.name,
      levelEmoji: getLevelEmoji(level),
      todayScore: dayLog?.daily_score,
    })

    setLoading(false)
  }

  const handleShare = async () => {
    if (!checkinData) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `complexo-checkin.png`, { type: 'image/png' })
        const text = generateShareText('checkin', checkinData as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'Complexo Wellness',
            text: text + ' #VivendoFelice',
            files: [file],
          })
        } else {
          downloadImage(blob, `complexo-checkin-${Date.now()}.png`)
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
        downloadImage(blob, `complexo-checkin-${Date.now()}.png`)
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

  if (!checkinData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="container flex items-center gap-4 h-14 px-4">
            <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Erro ao carregar</h1>
          </div>
        </header>
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
          <h1 className="text-lg font-semibold">Check-in Diario</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="transform scale-[0.6] origin-top">
            <SharePreview
              ref={previewRef}
              type="checkin"
              data={checkinData}
              theme={theme}
              format={format}
            />
          </div>
        </div>

        {/* Customizer */}
        <div className="bg-muted/30 rounded-xl p-4">
          <CardCustomizer
            theme={theme}
            format={format}
            onThemeChange={setTheme}
            onFormatChange={setFormat}
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

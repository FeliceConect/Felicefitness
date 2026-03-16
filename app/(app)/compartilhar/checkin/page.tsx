'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Instagram, Share2, Download } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareTheme, CheckinShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { cn } from '@/lib/utils'
import { getLevelFromXP, getLevelEmoji } from '@/lib/gamification/level-system'

export default function CompartilharCheckinPage() {
  const [checkinData, setCheckinData] = useState<CheckinShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('light')
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadCheckinData()
  }, [])

  const loadCheckinData = async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setFallbackData(); return }

      const { data: stats } = await supabase
        .from('user_stats')
        .select('current_streak, best_streak, total_xp, join_date')
        .eq('user_id', user.id)
        .single() as { data: { current_streak: number; best_streak: number; total_xp: number; join_date: string } | null }

      const today = new Date().toISOString().split('T')[0]
      const { data: dayLog } = await supabase
        .from('fitness_daily_logs')
        .select('workout_completed, meals_logged, water_consumed, water_goal, sleep_logged, checkin_done, daily_score')
        .eq('user_id', user.id)
        .eq('date', today)
        .single() as { data: { workout_completed: boolean; meals_logged: number; water_consumed: number; water_goal: number; sleep_logged: boolean; checkin_done: boolean; daily_score: number } | null }

      let journeyDays = 1
      if (stats?.join_date) {
        const joinDate = new Date(stats.join_date)
        const now = new Date()
        journeyDays = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      }

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
    } catch {
      setFallbackData()
    }

    setLoading(false)
  }

  const setFallbackData = () => {
    const level = getLevelFromXP(0)
    setCheckinData({
      journeyDays: 42,
      streak: 7,
      treino: true,
      nutricao: true,
      hidratacao: false,
      sono: true,
      level: level.level,
      levelName: level.name,
      levelEmoji: getLevelEmoji(level),
      todayScore: 75,
    })
    setLoading(false)
  }

  const getBlob = async () => {
    const element = previewRef.current?.getElement() ?? null
    return generateImage(element)
  }

  const handleInstagramShare = async () => {
    setIsSharing(true)
    try {
      const blob = await getBlob()
      if (!blob) return

      const file = new File([blob], 'complexo-checkin.png', { type: 'image/png' })

      if (canShareFiles) {
        // Web Share API opens native share sheet — user picks Instagram Stories
        await share({ files: [file] })
      } else {
        // Fallback: download image, then try to open Instagram
        downloadImage(blob, `complexo-checkin-${Date.now()}.png`)
        // Try opening Instagram Stories camera
        setTimeout(() => {
          window.location.href = 'instagram-stories://share'
        }, 500)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const blob = await getBlob()
      if (!blob) return

      const file = new File([blob], 'complexo-checkin.png', { type: 'image/png' })

      if (canShareFiles) {
        await share({
          title: 'Complexo Wellness',
          text: '#VivendoFelice',
          files: [file],
        })
      } else {
        downloadImage(blob, `complexo-checkin-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    setIsSharing(true)
    try {
      const blob = await getBlob()
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Check-in Diario</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-5">
        {/* Preview — always story format */}
        <div className="flex justify-center">
          <div className="w-[260px]">
            <SharePreview
              ref={previewRef}
              type="checkin"
              data={checkinData}
              theme={theme}
              format="story"
            />
          </div>
        </div>

        {/* Theme only */}
        <div className="bg-muted/30 rounded-xl p-4">
          <CardCustomizer
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Primary: Instagram Stories */}
          <button
            onClick={handleInstagramShare}
            disabled={isSharing}
            className={cn(
              'flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]',
              isSharing && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)',
              color: '#fff',
            }}
          >
            <Instagram className="w-5 h-5" />
            {isSharing ? 'Gerando imagem...' : 'Postar nos Stories'}
          </button>

          {/* Secondary row */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border',
                'hover:bg-muted transition-colors',
                isSharing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
            <button
              onClick={handleDownload}
              disabled={isSharing}
              className={cn(
                'flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border',
                'hover:bg-muted transition-colors',
                isSharing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

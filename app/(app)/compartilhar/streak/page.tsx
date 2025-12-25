'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, StreakShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'

export default function CompartilharStreakPage() {
  const [streakData, setStreakData] = useState<StreakShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('fire')
  const [format, setFormat] = useState<ShareFormat>('square')
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadStreak()
  }, [])

  const loadStreak = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_stats')
      .select('current_streak, best_streak')
      .eq('user_id', user.id)
      .single() as { data: { current_streak: number; best_streak: number } | null }

    if (data) {
      const days = data.current_streak || 0
      let message = 'Comecando a jornada!'

      if (days >= 30) {
        message = 'Imparavel! Um mes de dedicacao!'
      } else if (days >= 14) {
        message = 'Duas semanas de consistencia!'
      } else if (days >= 7) {
        message = 'Uma semana de foco total!'
      } else if (days >= 3) {
        message = 'Mantendo o ritmo!'
      } else if (days > 0) {
        message = 'Cada dia conta!'
      }

      setStreakData({
        days,
        message,
        record: data.best_streak || 0,
        userName: user.user_metadata?.name || 'Atleta',
      })
    }
    setLoading(false)
  }

  const handleShare = async () => {
    if (!streakData) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `felicefit-streak.png`, { type: 'image/png' })
        const text = generateShareText('streak', streakData as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'FeliceFit',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `felicefit-streak-${Date.now()}.png`)
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
        downloadImage(blob, `felicefit-streak-${Date.now()}.png`)
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

  if (!streakData) {
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
          <h1 className="text-lg font-semibold">Compartilhar Sequencia</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="transform scale-[0.6] origin-top">
            <SharePreview
              ref={previewRef}
              type="streak"
              data={streakData}
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

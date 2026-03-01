'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, AchievementShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'

export default function CompartilharConquistaIdPage() {
  const params = useParams()
  const achievementId = params.id as string

  const [achievement, setAchievement] = useState<AchievementShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('power')
  const [format, setFormat] = useState<ShareFormat>('square')
  const [showDate, setShowDate] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadAchievement()
  }, [achievementId])

  const loadAchievement = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlocked_at,
        achievement:achievements(name, description, icon, rarity)
      `)
      .eq('id', achievementId)
      .eq('user_id', user.id)
      .single() as { data: {
        id: string
        unlocked_at: string
        achievement: {
          name: string
          description: string
          icon: string
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
        }
      } | null }

    if (data) {
      setAchievement({
        name: data.achievement.name,
        description: data.achievement.description,
        icon: data.achievement.icon,
        rarity: data.achievement.rarity,
        date: data.unlocked_at,
        userName: user.user_metadata?.name || 'Atleta',
      })
    }
    setLoading(false)
  }

  const handleShare = async () => {
    if (!achievement) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `felicefit-conquista.png`, { type: 'image/png' })
        const text = generateShareText('achievement', achievement as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'Complexo Wellness',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `felicefit-conquista-${Date.now()}.png`)
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
        downloadImage(blob, `felicefit-conquista-${Date.now()}.png`)
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

  if (!achievement) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="container flex items-center gap-4 h-14 px-4">
            <Link href="/compartilhar/conquista" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Conquista nao encontrada</h1>
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
          <Link href="/compartilhar/conquista" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar Conquista</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="transform scale-[0.6] origin-top">
            <SharePreview
              ref={previewRef}
              type="achievement"
              data={achievement}
              theme={theme}
              format={format}
              showDate={showDate}
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, WorkoutShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'

export default function CompartilharTreinoIdPage() {
  const params = useParams()
  const workoutId = params.id as string

  const [workout, setWorkout] = useState<WorkoutShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('power')
  const [format, setFormat] = useState<ShareFormat>('square')
  const [showStats, setShowStats] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadWorkout()
  }, [workoutId])

  const loadWorkout = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('fitness_workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single() as { data: {
        nome: string
        duracao_minutos: number
        exercises_count: number
        sets_count: number
        calorias_estimadas: number
        data: string
        prs_count: number
      } | null }

    if (data) {
      const hrs = Math.floor(data.duracao_minutos / 60)
      const mins = data.duracao_minutos % 60
      const duration = hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`

      setWorkout({
        workoutName: data.nome,
        duration,
        exercises: data.exercises_count,
        sets: data.sets_count,
        calories: data.calorias_estimadas,
        date: data.data,
        prs: data.prs_count || 0,
        userName: user.user_metadata?.name || 'Atleta',
      })
    }
    setLoading(false)
  }

  const handleShare = async () => {
    if (!workout) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `felicefit-treino.png`, { type: 'image/png' })
        const text = generateShareText('workout', workout as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'Complexo Wellness',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `felicefit-treino-${Date.now()}.png`)
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
        downloadImage(blob, `felicefit-treino-${Date.now()}.png`)
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

  if (!workout) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="container flex items-center gap-4 h-14 px-4">
            <Link href="/compartilhar/treino" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Treino nao encontrado</h1>
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
          <Link href="/compartilhar/treino" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar Treino</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="transform scale-[0.6] origin-top">
            <SharePreview
              ref={previewRef}
              type="workout"
              data={workout}
              theme={theme}
              format={format}
              showStats={showStats}
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
            showStats={showStats}
            showDate={showDate}
            onShowStatsChange={setShowStats}
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

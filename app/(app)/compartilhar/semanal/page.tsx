'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Instagram, Share2, Download } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareTheme, WeeklyShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CompartilharSemanalPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ShareTheme>('light')
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
      .from('fitness_workouts')
      .select('duracao_minutos, sets_count, calorias_estimadas, prs_count')
      .eq('user_id', user.id)
      .eq('status', 'concluido')
      .gte('data', weekStart.toISOString())
      .lte('data', weekEnd.toISOString()) as { data: {
        duracao_minutos: number
        sets_count: number
        calorias_estimadas: number
        prs_count: number
      }[] | null }

    // Get planned workouts from user settings or default
    const workoutsPlanned = 5 // Default, could be fetched from user settings

    if (workouts) {
      const totalMinutes = workouts.reduce((sum, w) => sum + (w.duracao_minutos || 0), 0)
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const totalDuration = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`

      const totalCalories = workouts.reduce((sum, w) => sum + (w.calorias_estimadas || 0), 0)
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

  const handleInstagramShare = async () => {
    if (!weeklyData) return
    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)
      if (!blob) return
      const file = new File([blob], 'complexo-semanal.png', { type: 'image/png' })
      if (canShareFiles) {
        await share({ files: [file] })
      } else {
        downloadImage(blob, `complexo-semanal-${Date.now()}.png`)
        setTimeout(() => { window.location.href = 'instagram-stories://share' }, 500)
      }
    } finally { setIsSharing(false) }
  }

  const handleShare = async () => {
    if (!weeklyData) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], 'complexo-semanal.png', { type: 'image/png' })
        const text = generateShareText('weekly', weeklyData as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'Complexo Wellness',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `complexo-semanal-${Date.now()}.png`)
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
        downloadImage(blob, `complexo-semanal-${Date.now()}.png`)
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
          <div className="w-[270px]">
            <SharePreview
              ref={previewRef}
              type="weekly"
              data={weeklyData}
              theme={theme}
              format="story"
            />
          </div>
        </div>

        {/* Customizer */}
        <div className="bg-muted/30 rounded-xl p-4">
          <CardCustomizer
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
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

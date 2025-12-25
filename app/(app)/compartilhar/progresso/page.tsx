'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Camera, Upload } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SharePreview, SharePreviewHandle } from '@/components/share/share-preview'
import { CardCustomizer } from '@/components/share/card-customizer'
import type { ShareFormat, ShareTheme, ProgressShareData } from '@/types/share'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO, format as formatDate } from 'date-fns'

interface ProgressPhoto {
  id: string
  photo_url: string
  taken_at: string
  weight?: number
  body_fat?: number
  muscle_mass?: number
}

export default function CompartilharProgressoPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [beforePhoto, setBeforePhoto] = useState<ProgressPhoto | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<ProgressPhoto | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [theme, setTheme] = useState<ShareTheme>('power')
  const [format, setFormat] = useState<ShareFormat>('square')
  const [showStats, setShowStats] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })
      .limit(50) as { data: ProgressPhoto[] | null }

    if (data) {
      setPhotos(data)
      // Auto-select first and last if available
      if (data.length >= 2) {
        setBeforePhoto(data[data.length - 1])
        setAfterPhoto(data[0])
      }
    }
    setLoading(false)
  }

  const getProgressData = (): ProgressShareData | null => {
    if (!beforePhoto || !afterPhoto) return null

    const daysBetween = differenceInDays(
      parseISO(afterPhoto.taken_at),
      parseISO(beforePhoto.taken_at)
    )

    return {
      beforePhoto: beforePhoto.photo_url,
      afterPhoto: afterPhoto.photo_url,
      daysBetween: Math.abs(daysBetween),
      stats: (beforePhoto.weight && afterPhoto.weight) ? {
        weight: {
          before: beforePhoto.weight,
          after: afterPhoto.weight,
        },
        fat: (beforePhoto.body_fat && afterPhoto.body_fat) ? {
          before: beforePhoto.body_fat,
          after: afterPhoto.body_fat,
        } : undefined,
        muscle: (beforePhoto.muscle_mass && afterPhoto.muscle_mass) ? {
          before: beforePhoto.muscle_mass,
          after: afterPhoto.muscle_mass,
        } : undefined,
      } : undefined,
      userName: 'Atleta',
    }
  }

  const handleShare = async () => {
    const progressData = getProgressData()
    if (!progressData) return

    setIsSharing(true)
    try {
      const element = previewRef.current?.getElement() ?? null
      const blob = await generateImage(element)

      if (blob) {
        const file = new File([blob], `felicefit-progresso.png`, { type: 'image/png' })
        const text = generateShareText('progress', progressData as unknown as Record<string, unknown>)

        if (canShareFiles) {
          await share({
            title: 'FeliceFit',
            text,
            files: [file],
          })
        } else {
          downloadImage(blob, `felicefit-progresso-${Date.now()}.png`)
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
        downloadImage(blob, `felicefit-progresso-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const progressData = getProgressData()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showPreview && progressData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="container flex items-center gap-4 h-14 px-4">
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Preview do Progresso</h1>
          </div>
        </header>

        <main className="container px-4 py-6 space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="transform scale-[0.5] origin-top">
              <SharePreview
                ref={previewRef}
                type="progress"
                data={progressData}
                theme={theme}
                format={format}
                showStats={showStats}
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
              onShowStatsChange={setShowStats}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Link href="/compartilhar" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Compartilhar Progresso</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        {photos.length < 2 ? (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Voce precisa de pelo menos 2 fotos de progresso
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione fotos na aba de progresso para poder comparar
            </p>
            <Link
              href="/progresso"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              <Upload className="w-4 h-4" />
              Adicionar Fotos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Before Selection */}
            <div>
              <h3 className="font-medium mb-3">Foto Antes</h3>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setBeforePhoto(photo)}
                    className={cn(
                      'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      beforePhoto?.id === photo.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photo_url}
                      alt="Progress photo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {beforePhoto && (
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(parseISO(beforePhoto.taken_at), 'dd/MM/yyyy')}
                  {beforePhoto.weight && ` - ${beforePhoto.weight}kg`}
                </p>
              )}
            </div>

            {/* After Selection */}
            <div>
              <h3 className="font-medium mb-3">Foto Depois</h3>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setAfterPhoto(photo)}
                    className={cn(
                      'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      afterPhoto?.id === photo.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photo_url}
                      alt="Progress photo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {afterPhoto && (
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(parseISO(afterPhoto.taken_at), 'dd/MM/yyyy')}
                  {afterPhoto.weight && ` - ${afterPhoto.weight}kg`}
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setShowPreview(true)}
              disabled={!beforePhoto || !afterPhoto}
              className={cn(
                'w-full py-3 rounded-xl font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                (!beforePhoto || !afterPhoto) && 'opacity-50 cursor-not-allowed'
              )}
            >
              Criar Card de Progresso
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

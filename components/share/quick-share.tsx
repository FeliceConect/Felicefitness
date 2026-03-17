'use client'

import { useState, useRef, useCallback } from 'react'
import { Share2, Download, X, Instagram, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SharePreview, SharePreviewHandle } from './share-preview'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import type { ShareType, ShareCardData, ShareTheme } from '@/types/share'

interface QuickShareProps {
  type: ShareType
  data: ShareCardData
  theme?: ShareTheme
  onClose: () => void
  title?: string
  subtitle?: string
}

/**
 * QuickShare — Post-action share overlay.
 * One-tap sharing right after completing a check-in, workout, etc.
 * Always uses story format. Theme defaults to light.
 */
export function QuickShare({
  type,
  data,
  theme = 'light',
  onClose,
  title = 'Compartilhe sua jornada!',
  subtitle = 'Poste nos stories e inspire outros',
}: QuickShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ShareTheme>(theme)
  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()
  const router = useRouter()

  const getImageBlob = useCallback(async () => {
    const element = previewRef.current?.getElement() ?? null
    return generateImage(element)
  }, [generateImage])

  const handleInstagramShare = async () => {
    setIsSharing(true)
    try {
      const blob = await getImageBlob()
      if (!blob) return

      const file = new File([blob], `complexo-${type}.png`, { type: 'image/png' })

      if (canShareFiles) {
        // Opens native share sheet — user picks Instagram Stories
        await share({ files: [file] })
      } else {
        // Download then try to open Instagram
        downloadImage(blob, `complexo-${type}-${Date.now()}.png`)
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
      const blob = await getImageBlob()
      if (!blob) return

      const file = new File([blob], `complexo-${type}.png`, { type: 'image/png' })

      if (canShareFiles) {
        await share({
          title: 'Complexo Wellness',
          text: '#VivendoFelice',
          files: [file],
        })
      } else {
        downloadImage(blob, `complexo-${type}-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    setIsSharing(true)
    try {
      const blob = await getImageBlob()
      if (blob) {
        downloadImage(blob, `complexo-${type}-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleCustomize = () => {
    onClose()
    router.push(`/compartilhar/${type === 'checkin' ? 'checkin' : type}`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Close button */}
      <div className="flex justify-end p-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/60 hover:text-white/90 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-heading font-bold text-white">{title}</h2>
          <p className="text-sm text-white/50 mt-1">{subtitle}</p>
        </div>

        {/* Card Preview — rendered at 270px for 1080px capture at 4x, scaled down visually */}
        <div className="flex-shrink-0" style={{ width: 180, height: 320, overflow: 'hidden' }}>
          <div style={{ transform: 'scale(0.6667)', transformOrigin: 'top left', width: 270 }}>
            <SharePreview
              ref={previewRef}
              type={type}
              data={data}
              theme={selectedTheme}
              format="story"
            />
          </div>
        </div>

        {/* Theme toggle */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setSelectedTheme('light')}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: selectedTheme === 'light' ? 'rgba(194,152,99,0.25)' : 'rgba(255,255,255,0.08)',
              color: selectedTheme === 'light' ? '#c29863' : 'rgba(255,255,255,0.5)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: selectedTheme === 'light' ? 'rgba(194,152,99,0.4)' : 'rgba(255,255,255,0.1)',
            }}
          >
            Claro
          </button>
          <button
            onClick={() => setSelectedTheme('gradient')}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: selectedTheme === 'gradient' ? 'rgba(194,152,99,0.25)' : 'rgba(255,255,255,0.08)',
              color: selectedTheme === 'gradient' ? '#c29863' : 'rgba(255,255,255,0.5)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: selectedTheme === 'gradient' ? 'rgba(194,152,99,0.4)' : 'rgba(255,255,255,0.1)',
            }}
          >
            Vinho
          </button>
        </div>

        {/* Customize link */}
        <button
          onClick={handleCustomize}
          className="mt-2.5 flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          Mais opções
        </button>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col gap-3 w-full max-w-[280px]">
          {/* Primary: Instagram Stories */}
          <button
            onClick={handleInstagramShare}
            disabled={isSharing}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)',
              color: '#fff',
              opacity: isSharing ? 0.6 : 1,
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
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-white/15 text-white/80 hover:bg-white/5 transition-colors active:scale-[0.97]"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
            <button
              onClick={handleDownload}
              disabled={isSharing}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-white/15 text-white/80 hover:bg-white/5 transition-colors active:scale-[0.97]"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={onClose}
            className="py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  )
}

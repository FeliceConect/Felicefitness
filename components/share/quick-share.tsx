'use client'

import { useState, useRef, useCallback } from 'react'
import { Share2, Download, X, Instagram, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SharePreview, SharePreviewHandle } from './share-preview'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'
import { generateShareText } from '@/lib/share/messages'
import type { ShareType, ShareCardData, ShareTheme, ShareFormat } from '@/types/share'

interface QuickShareProps {
  type: ShareType
  data: ShareCardData
  theme?: ShareTheme
  format?: ShareFormat
  onClose: () => void
  title?: string
  subtitle?: string
}

/**
 * QuickShare — Post-action share overlay.
 * Shows a card preview with one-tap share buttons.
 * Designed to appear right after completing a check-in, workout, etc.
 */
export function QuickShare({
  type,
  data,
  theme = 'power',
  format = 'story',
  onClose,
  title = 'Compartilhe sua jornada!',
  subtitle = 'Poste nos stories e inspire outros',
}: QuickShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()
  const router = useRouter()

  const getImageBlob = useCallback(async () => {
    const element = previewRef.current?.getElement() ?? null
    return generateImage(element)
  }, [generateImage])

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const blob = await getImageBlob()
      if (!blob) return

      const file = new File([blob], `complexo-${type}.png`, { type: 'image/png' })
      const text = generateShareText(type, data as unknown as Record<string, unknown>)

      if (canShareFiles) {
        await share({
          title: 'Complexo Wellness',
          text: text + ' #VivendoFelice',
          files: [file],
        })
      } else {
        downloadImage(blob, `complexo-${type}-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleInstagram = async () => {
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
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-md overflow-y-auto">
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-heading font-bold text-white">{title}</h2>
          <p className="text-sm text-white/50 mt-1">{subtitle}</p>
        </div>

        {/* Card Preview — story format (taller, fits all content) */}
        <div className="w-[180px] flex-shrink-0">
          <SharePreview
            ref={previewRef}
            type={type}
            data={data}
            theme={theme}
            format={format}
          />
        </div>

        {/* Customize link */}
        <button
          onClick={handleCustomize}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Personalizar tema e formato
        </button>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col gap-3 w-full max-w-[280px]">
          {/* Primary: Instagram */}
          <button
            onClick={handleInstagram}
            disabled={isSharing}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)',
              color: '#fff',
              opacity: isSharing ? 0.6 : 1,
            }}
          >
            <Instagram className="w-5 h-5" />
            {isSharing ? 'Gerando...' : 'Postar no Instagram'}
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

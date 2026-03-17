'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Download, Share2, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShareType, ShareTheme, ShareCardData } from '@/types/share'
import { SharePreview, SharePreviewHandle } from './share-preview'
import { useShareImage } from '@/hooks/use-share-image'
import { useWebShare } from '@/hooks/use-web-share'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  type: ShareType
  data: ShareCardData
  initialTheme?: ShareTheme
}

export function ShareModal({
  open,
  onClose,
  type,
  data,
  initialTheme = 'light',
}: ShareModalProps) {
  const [theme, setTheme] = useState<ShareTheme>(initialTheme)
  const [isSharing, setIsSharing] = useState(false)

  const previewRef = useRef<SharePreviewHandle>(null)
  const { generateImage, downloadImage } = useShareImage()
  const { share, canShareFiles } = useWebShare()

  const getBlob = useCallback(async () => {
    const element = previewRef.current?.getElement() ?? null
    return generateImage(element)
  }, [generateImage])

  const handleInstagramShare = async () => {
    setIsSharing(true)
    try {
      const blob = await getBlob()
      if (!blob) return

      const file = new File([blob], `complexo-${type}.png`, { type: 'image/png' })

      if (canShareFiles) {
        await share({ files: [file] })
      } else {
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
      const blob = await getBlob()
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
      const blob = await getBlob()
      if (blob) {
        downloadImage(blob, `complexo-${type}-${Date.now()}.png`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-foreground">Compartilhar</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-background-elevated transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Card Preview — 270px for 1080px capture at 4x */}
          <div className="p-4 flex justify-center bg-background-elevated/30">
            <div className="w-[270px]">
              <SharePreview
                ref={previewRef}
                type={type}
                data={data}
                theme={theme}
                format="story"
              />
            </div>
          </div>

          {/* Theme toggle — only Claro and Vinho */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Tema</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all',
                  theme === 'light'
                    ? 'border-dourado bg-dourado/5'
                    : 'border-border hover:border-foreground-muted'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-[#f7f2ed] border border-black/5" />
                <span className={cn(
                  'text-sm font-medium',
                  theme === 'light' ? 'text-dourado' : 'text-foreground-secondary'
                )}>
                  Claro
                </span>
              </button>
              <button
                onClick={() => setTheme('gradient')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all',
                  theme === 'gradient'
                    ? 'border-dourado bg-dourado/5'
                    : 'border-border hover:border-foreground-muted'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#663739] to-[#322b29]" />
                <span className={cn(
                  'text-sm font-medium',
                  theme === 'gradient' ? 'text-dourado' : 'text-foreground-secondary'
                )}>
                  Vinho
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions — fixed at bottom */}
        <div className="border-t border-border p-4 space-y-3 bg-white">
          {/* Primary: Instagram Stories */}
          <button
            onClick={handleInstagramShare}
            disabled={isSharing}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]',
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
      </div>
    </div>
  )
}

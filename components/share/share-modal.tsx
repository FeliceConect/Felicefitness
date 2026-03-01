'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Download, Share2, Copy, Check, Instagram, MessageCircle, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShareType, ShareFormat, ShareTheme, ShareCardData } from '@/types/share'
import { SharePreview, SharePreviewHandle } from './share-preview'
import { CardCustomizer } from './card-customizer'
import { generateShareText } from '@/lib/share/messages'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  type: ShareType
  data: ShareCardData
  initialTheme?: ShareTheme
  initialFormat?: ShareFormat
}

type ShareDestination = 'native' | 'instagram' | 'whatsapp' | 'twitter' | 'download' | 'copy'

export function ShareModal({
  open,
  onClose,
  type,
  data,
  initialTheme = 'power',
  initialFormat = 'square',
}: ShareModalProps) {
  const [theme, setTheme] = useState<ShareTheme>(initialTheme)
  const [format, setFormat] = useState<ShareFormat>(initialFormat)
  const [showStats, setShowStats] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('preview')

  const previewRef = useRef<SharePreviewHandle>(null)

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const element = previewRef.current?.getElement()
    if (!element) return null

    try {
      // Dynamic import for html-to-image
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })

      // Convert to blob
      const res = await fetch(dataUrl)
      return await res.blob()
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    }
  }, [])

  const handleShare = async (destination: ShareDestination) => {
    setIsGenerating(true)

    try {
      const blob = await generateImage()
      if (!blob) {
        throw new Error('Failed to generate image')
      }

      const file = new File([blob], `felicefit-${type}.png`, { type: 'image/png' })
      const shareText = generateShareText(type, data as unknown as Record<string, unknown>)

      switch (destination) {
        case 'native':
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              title: 'Complexo Wellness',
              text: shareText,
              files: [file],
            })
          } else {
            // Fallback to download
            downloadImage(blob)
          }
          break

        case 'instagram':
          // Instagram doesn't support direct sharing, download and prompt
          downloadImage(blob)
          alert('Imagem salva! Abra o Instagram e compartilhe a imagem dos seus arquivos.')
          break

        case 'whatsapp':
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              text: shareText,
              files: [file],
            })
          } else {
            // Fallback: open WhatsApp with text only
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
            window.open(whatsappUrl, '_blank')
            downloadImage(blob)
          }
          break

        case 'twitter':
          // Twitter Web Intent
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
          window.open(twitterUrl, '_blank')
          downloadImage(blob)
          break

        case 'download':
          downloadImage(blob)
          break

        case 'copy':
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ])
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            // Fallback: copy text
            await navigator.clipboard.writeText(shareText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
          break
      }
    } catch (error) {
      console.error('Share error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `felicefit-${type}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Compartilhar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'preview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'customize'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Personalizar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'preview' ? (
            <div className="flex flex-col items-center">
              {/* Card Preview */}
              <div className="transform scale-75 origin-top">
                <SharePreview
                  ref={previewRef}
                  type={type}
                  data={data}
                  theme={theme}
                  format={format}
                  showStats={showStats}
                  showDate={showDate}
                />
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Share Destinations */}
        <div className="border-t p-4 space-y-4">
          {/* Quick Share Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <ShareDestinationButton
              icon={<Share2 className="w-5 h-5" />}
              label="Share"
              onClick={() => handleShare('native')}
              disabled={isGenerating}
            />
            <ShareDestinationButton
              icon={<Instagram className="w-5 h-5" />}
              label="Instagram"
              onClick={() => handleShare('instagram')}
              disabled={isGenerating}
            />
            <ShareDestinationButton
              icon={<MessageCircle className="w-5 h-5" />}
              label="WhatsApp"
              onClick={() => handleShare('whatsapp')}
              disabled={isGenerating}
            />
            <ShareDestinationButton
              icon={<Twitter className="w-5 h-5" />}
              label="Twitter"
              onClick={() => handleShare('twitter')}
              disabled={isGenerating}
            />
            <ShareDestinationButton
              icon={copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              label={copied ? 'Copiado!' : 'Copiar'}
              onClick={() => handleShare('copy')}
              disabled={isGenerating}
            />
          </div>

          {/* Download Button */}
          <button
            onClick={() => handleShare('download')}
            disabled={isGenerating}
            className={cn(
              'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              isGenerating && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Baixar Imagem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ShareDestinationButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

function ShareDestinationButton({ icon, label, onClick, disabled }: ShareDestinationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
        'hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}

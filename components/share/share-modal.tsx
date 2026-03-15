'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Download, Share2, Copy, Check, Instagram, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShareType, ShareFormat, ShareTheme, ShareCardData } from '@/types/share'
import { SharePreview, SharePreviewHandle } from './share-preview'
import { generateShareText } from '@/lib/share/messages'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  type: ShareType
  data: ShareCardData
  initialTheme?: ShareTheme
  initialFormat?: ShareFormat
}

type ShareDestination = 'native' | 'instagram' | 'whatsapp' | 'download' | 'copy'

const THEMES: { id: ShareTheme; name: string; preview: string }[] = [
  { id: 'power', name: 'Escuro', preview: 'bg-[#1a1615]' },
  { id: 'light', name: 'Claro', preview: 'bg-[#f7f2ed]' },
  { id: 'gradient', name: 'Vinho', preview: 'bg-gradient-to-br from-[#663739] to-[#322b29]' },
  { id: 'fire', name: 'Dourado', preview: 'bg-gradient-to-br from-[#c29863] to-[#663739]' },
]

const FORMATS: { id: ShareFormat; name: string; label: string }[] = [
  { id: 'square', name: 'Post', label: '1:1' },
  { id: 'story', name: 'Story', label: '9:16' },
  { id: 'wide', name: 'Wide', label: '16:9' },
]

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

  const previewRef = useRef<SharePreviewHandle>(null)

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const element = previewRef.current?.getElement()
    if (!element) return null

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
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
      if (!blob) throw new Error('Failed to generate image')

      const file = new File([blob], `complexo-wellness-${type}.png`, { type: 'image/png' })
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
            downloadImage(blob)
          }
          break

        case 'instagram':
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] })
          } else {
            downloadImage(blob)
          }
          break

        case 'whatsapp':
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ text: shareText, files: [file] })
          } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
            window.open(whatsappUrl, '_blank')
            downloadImage(blob)
          }
          break

        case 'download':
          downloadImage(blob)
          break

        case 'copy':
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ])
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
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
    link.download = `complexo-wellness-${type}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          {/* Card Preview — always visible with explicit width */}
          <div className="p-4 flex justify-center bg-background-elevated/30">
            <div className="w-[280px]">
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

          {/* Customization — inline below preview */}
          <div className="px-4 py-3 space-y-4 border-t border-border">
            {/* Theme */}
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Tema</p>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all',
                      theme === t.id
                        ? 'border-dourado bg-dourado/5'
                        : 'border-border hover:border-foreground-muted'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg', t.preview)} />
                    <span className="text-[10px] text-foreground-secondary">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Formato</p>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border-2 text-center transition-all',
                      format === f.id
                        ? 'border-dourado bg-dourado/5 text-dourado font-medium'
                        : 'border-border text-foreground-secondary hover:border-foreground-muted'
                    )}
                  >
                    <span className="text-sm">{f.name}</span>
                    <span className="text-[10px] block text-foreground-muted">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm transition-all',
                  showStats
                    ? 'border-dourado bg-dourado/10 text-dourado'
                    : 'border-border text-foreground-muted'
                )}
              >
                {showStats ? 'Stats: On' : 'Stats: Off'}
              </button>
              <button
                onClick={() => setShowDate(!showDate)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm transition-all',
                  showDate
                    ? 'border-dourado bg-dourado/10 text-dourado'
                    : 'border-border text-foreground-muted'
                )}
              >
                {showDate ? 'Data: On' : 'Data: Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Share Destinations — fixed at bottom */}
        <div className="border-t border-border p-4 space-y-3 bg-white">
          {/* Quick Share Buttons */}
          <div className="flex justify-center gap-4">
            <ShareDestinationButton
              icon={<Share2 className="w-5 h-5" />}
              label="Enviar"
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
              icon={copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
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
              'bg-dourado text-white hover:bg-dourado/90',
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
        'flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors',
        'hover:bg-background-elevated',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="text-foreground-secondary">{icon}</div>
      <span className="text-[10px] text-foreground-muted">{label}</span>
    </button>
  )
}

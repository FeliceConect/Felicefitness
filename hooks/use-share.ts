'use client'

import { useState, useCallback } from 'react'
import type { ShareType, ShareFormat, ShareTheme, ShareCardData } from '@/types/share'
import { generateShareText } from '@/lib/share/messages'
import { useWebShare } from './use-web-share'
import { useShareImage } from './use-share-image'

interface UseShareOptions {
  type: ShareType
  data: ShareCardData
  theme?: ShareTheme
  format?: ShareFormat
}

interface UseShareReturn {
  // State
  isModalOpen: boolean
  theme: ShareTheme
  format: ShareFormat
  isSharing: boolean

  // Actions
  openModal: () => void
  closeModal: () => void
  setTheme: (theme: ShareTheme) => void
  setFormat: (format: ShareFormat) => void

  // Sharing
  shareNative: (element: HTMLElement | null) => Promise<boolean>
  shareToWhatsApp: (element: HTMLElement | null) => Promise<void>
  shareToTwitter: () => void
  downloadImage: (element: HTMLElement | null) => Promise<void>
  copyImage: (element: HTMLElement | null) => Promise<boolean>

  // Utils
  getShareText: () => string
}

export function useShare({
  type,
  data,
  theme: initialTheme = 'power',
  format: initialFormat = 'square',
}: UseShareOptions): UseShareReturn {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [theme, setTheme] = useState<ShareTheme>(initialTheme)
  const [format, setFormat] = useState<ShareFormat>(initialFormat)

  const { share, isSharing: isWebSharing } = useWebShare()
  const { generateImage, downloadImage: download, copyToClipboard, isGenerating } = useShareImage()

  const isSharing = isWebSharing || isGenerating

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const getShareText = useCallback(() => {
    return generateShareText(type, data as unknown as Record<string, unknown>)
  }, [type, data])

  const shareNative = useCallback(async (element: HTMLElement | null): Promise<boolean> => {
    const blob = await generateImage(element)
    if (!blob) return false

    const file = new File([blob], `felicefit-${type}.png`, { type: 'image/png' })
    const text = getShareText()

    return await share({
      title: 'Complexo Wellness',
      text,
      files: [file],
    })
  }, [generateImage, type, getShareText, share])

  const shareToWhatsApp = useCallback(async (element: HTMLElement | null): Promise<void> => {
    const blob = await generateImage(element)
    const text = getShareText()

    if (blob) {
      const file = new File([blob], `felicefit-${type}.png`, { type: 'image/png' })

      // Try native share first
      const shared = await share({
        text,
        files: [file],
      })

      if (!shared) {
        // Fallback: open WhatsApp with text and download image
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(whatsappUrl, '_blank')
        download(blob, `felicefit-${type}.png`)
      }
    } else {
      // No image, just share text
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(whatsappUrl, '_blank')
    }
  }, [generateImage, type, getShareText, share, download])

  const shareToTwitter = useCallback(() => {
    const text = getShareText()
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank')
  }, [getShareText])

  const downloadImageFn = useCallback(async (element: HTMLElement | null): Promise<void> => {
    const blob = await generateImage(element)
    if (blob) {
      download(blob, `felicefit-${type}-${Date.now()}.png`)
    }
  }, [generateImage, download, type])

  const copyImage = useCallback(async (element: HTMLElement | null): Promise<boolean> => {
    const blob = await generateImage(element)
    if (!blob) return false
    return await copyToClipboard(blob)
  }, [generateImage, copyToClipboard])

  return {
    // State
    isModalOpen,
    theme,
    format,
    isSharing,

    // Actions
    openModal,
    closeModal,
    setTheme,
    setFormat,

    // Sharing
    shareNative,
    shareToWhatsApp,
    shareToTwitter,
    downloadImage: downloadImageFn,
    copyImage,

    // Utils
    getShareText,
  }
}

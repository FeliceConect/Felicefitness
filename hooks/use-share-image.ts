'use client'

import { useState, useCallback, RefObject } from 'react'

interface UseShareImageOptions {
  quality?: number
  pixelRatio?: number
  backgroundColor?: string
}

interface UseShareImageReturn {
  generateImage: (element: HTMLElement | null) => Promise<Blob | null>
  generateDataUrl: (element: HTMLElement | null) => Promise<string | null>
  downloadImage: (blob: Blob, filename?: string) => void
  copyToClipboard: (blob: Blob) => Promise<boolean>
  isGenerating: boolean
  error: Error | null
}

export function useShareImage(options: UseShareImageOptions = {}): UseShareImageReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { quality = 1, pixelRatio = 2, backgroundColor } = options

  const generateDataUrl = useCallback(async (element: HTMLElement | null): Promise<string | null> => {
    if (!element) {
      setError(new Error('No element provided'))
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        quality,
        pixelRatio,
        backgroundColor,
        cacheBust: true,
      })
      return dataUrl
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate image'))
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [quality, pixelRatio, backgroundColor])

  const generateImage = useCallback(async (element: HTMLElement | null): Promise<Blob | null> => {
    const dataUrl = await generateDataUrl(element)
    if (!dataUrl) return null

    try {
      const res = await fetch(dataUrl)
      return await res.blob()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to convert to blob'))
      return null
    }
  }, [generateDataUrl])

  const downloadImage = useCallback((blob: Blob, filename: string = 'felicefit-share.png') => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const copyToClipboard = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to copy to clipboard'))
      return false
    }
  }, [])

  return {
    generateImage,
    generateDataUrl,
    downloadImage,
    copyToClipboard,
    isGenerating,
    error,
  }
}

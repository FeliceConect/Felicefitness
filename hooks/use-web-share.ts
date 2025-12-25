'use client'

import { useState, useCallback } from 'react'

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

interface UseWebShareReturn {
  isSupported: boolean
  canShareFiles: boolean
  share: (options: ShareOptions) => Promise<boolean>
  isSharing: boolean
  error: Error | null
}

export function useWebShare(): UseWebShareReturn {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.share
  const canShareFiles = typeof navigator !== 'undefined' &&
    !!navigator.canShare &&
    navigator.canShare({ files: [new File([], 'test.txt')] })

  const share = useCallback(async (options: ShareOptions): Promise<boolean> => {
    if (!isSupported) {
      setError(new Error('Web Share API not supported'))
      return false
    }

    setIsSharing(true)
    setError(null)

    try {
      // Check if we can share files
      if (options.files && options.files.length > 0) {
        if (!navigator.canShare?.({ files: options.files })) {
          // Remove files and share text only
          const { files, ...rest } = options
          await navigator.share(rest)
        } else {
          await navigator.share(options)
        }
      } else {
        await navigator.share(options)
      }

      return true
    } catch (err) {
      // User cancelled share
      if (err instanceof Error && err.name === 'AbortError') {
        return false
      }
      setError(err instanceof Error ? err : new Error('Share failed'))
      return false
    } finally {
      setIsSharing(false)
    }
  }, [isSupported])

  return {
    isSupported,
    canShareFiles,
    share,
    isSharing,
    error,
  }
}

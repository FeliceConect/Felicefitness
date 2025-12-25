'use client'

import { useState, useEffect, useCallback } from 'react'

export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      setIsFocusVisible(true)
    }
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsFocusVisible(false)
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [handleKeyDown, handleMouseDown])

  return isFocusVisible
}

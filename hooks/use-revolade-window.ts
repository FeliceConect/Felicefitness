"use client"

import { useState, useEffect } from 'react'
import type { RevoladeWindow, RevoladeConfig } from '@/lib/nutrition/types'
import { leonardoRevoladeConfig } from '@/lib/nutrition/types'
import { calculateRevoladeWindow } from '@/lib/nutrition/calculations'

export function useRevoladeWindow(config?: RevoladeConfig): RevoladeWindow {
  const effectiveConfig = config || leonardoRevoladeConfig

  const [window, setWindow] = useState<RevoladeWindow>(() =>
    calculateRevoladeWindow(effectiveConfig)
  )

  useEffect(() => {
    // Atualizar imediatamente
    setWindow(calculateRevoladeWindow(effectiveConfig))

    // Atualizar a cada minuto
    const interval = setInterval(() => {
      setWindow(calculateRevoladeWindow(effectiveConfig))
    }, 60000)

    return () => clearInterval(interval)
  }, [effectiveConfig])

  return window
}

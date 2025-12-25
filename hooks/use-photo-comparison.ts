"use client"

import { useState, useMemo, useCallback } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import type { ProgressPhoto, ComparisonMode, PhotoType } from '@/lib/photos/types'

interface UsePhotoComparisonReturn {
  // Fotos selecionadas
  beforePhoto: ProgressPhoto | null
  afterPhoto: ProgressPhoto | null

  // Seleção
  setBeforePhoto: (photo: ProgressPhoto | null) => void
  setAfterPhoto: (photo: ProgressPhoto | null) => void
  swapPhotos: () => void
  clearSelection: () => void

  // Modo de visualização
  mode: ComparisonMode
  setMode: (mode: ComparisonMode) => void

  // Análise
  comparison: {
    daysBetween: number
    monthsBetween: number
    weightChange: number | null
    fatPercentChange: number | null
  } | null

  // Estado
  isReady: boolean
}

export function usePhotoComparison(): UsePhotoComparisonReturn {
  const [beforePhoto, setBeforePhoto] = useState<ProgressPhoto | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<ProgressPhoto | null>(null)
  const [mode, setMode] = useState<ComparisonMode>('side-by-side')

  // Verificar se está pronto para comparação
  const isReady = useMemo(() => {
    return beforePhoto !== null && afterPhoto !== null
  }, [beforePhoto, afterPhoto])

  // Calcular análise de comparação
  const comparison = useMemo(() => {
    if (!beforePhoto || !afterPhoto) return null

    const daysBetween = differenceInDays(
      parseISO(afterPhoto.data),
      parseISO(beforePhoto.data)
    )

    const monthsBetween = Math.round(daysBetween / 30)

    let weightChange: number | null = null
    if (beforePhoto.peso !== undefined && afterPhoto.peso !== undefined) {
      weightChange = afterPhoto.peso - beforePhoto.peso
    }

    let fatPercentChange: number | null = null
    if (
      beforePhoto.percentual_gordura !== undefined &&
      afterPhoto.percentual_gordura !== undefined
    ) {
      fatPercentChange = afterPhoto.percentual_gordura - beforePhoto.percentual_gordura
    }

    return {
      daysBetween: Math.abs(daysBetween),
      monthsBetween: Math.abs(monthsBetween),
      weightChange,
      fatPercentChange
    }
  }, [beforePhoto, afterPhoto])

  // Trocar fotos
  const swapPhotos = useCallback(() => {
    const temp = beforePhoto
    setBeforePhoto(afterPhoto)
    setAfterPhoto(temp)
  }, [beforePhoto, afterPhoto])

  // Limpar seleção
  const clearSelection = useCallback(() => {
    setBeforePhoto(null)
    setAfterPhoto(null)
  }, [])

  return {
    beforePhoto,
    afterPhoto,
    setBeforePhoto,
    setAfterPhoto,
    swapPhotos,
    clearSelection,
    mode,
    setMode,
    comparison,
    isReady
  }
}

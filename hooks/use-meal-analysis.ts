"use client"

import { useState, useCallback } from 'react'
import type {
  MealAnalysisResult,
  AnalyzedFoodItem,
  AnalysisStatus,
  NutritionTotals
} from '@/types/analysis'
import { recalculateTotals, calculateOverallConfidence } from '@/lib/openai'

interface UseMealAnalysisReturn {
  // Estado
  status: AnalysisStatus
  isAnalyzing: boolean
  result: MealAnalysisResult | null
  error: string | null
  imagePreview: string | null

  // Ações
  analyzeImage: (file: File) => Promise<void>
  clearResult: () => void
  setImagePreview: (url: string | null) => void

  // Edição do resultado
  updateItem: (id: string, data: Partial<AnalyzedFoodItem>) => void
  removeItem: (id: string) => void
  addItem: (item: Omit<AnalyzedFoodItem, 'id'>) => void

  // Salvar
  getUpdatedResult: () => MealAnalysisResult | null
}

export function useMealAnalysis(): UseMealAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [result, setResult] = useState<MealAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const isAnalyzing = status === 'uploading' || status === 'analyzing'

  // Analisar imagem
  const analyzeImage = useCallback(async (file: File) => {
    setStatus('uploading')
    setError(null)
    setResult(null)

    try {
      // Validar arquivo
      if (!file) {
        throw new Error('Nenhum arquivo selecionado')
      }

      // Validar tamanho (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('Imagem muito grande. Máximo 4MB.')
      }

      // Validar tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        throw new Error('Formato inválido. Use JPEG, PNG, WebP ou GIF.')
      }

      // Criar preview
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      // Enviar para API
      setStatus('analyzing')

      const formData = new FormData()
      formData.append('image', file)

      console.log('[MealAnalysis] Enviando imagem para análise...', {
        size: file.size,
        type: file.type,
        name: file.name
      })

      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        body: formData
      })

      console.log('[MealAnalysis] Resposta recebida:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[MealAnalysis] Erro na resposta:', errorText)
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data: MealAnalysisResult = await response.json()

      console.log('[MealAnalysis] Dados recebidos:', {
        success: data.success,
        itemsCount: data.items?.length,
        error: data.error
      })

      if (!data.success) {
        throw new Error(data.error || 'Falha na análise')
      }

      setResult(data)
      setStatus('success')

    } catch (err) {
      console.error('[MealAnalysis] Erro:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise'
      setError(errorMessage)
      setStatus('error')
    }
  }, [])

  // Limpar resultado
  const clearResult = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setResult(null)
    setError(null)
    setStatus('idle')
    setImagePreview(null)
  }, [imagePreview])

  // Atualizar item
  const updateItem = useCallback((id: string, data: Partial<AnalyzedFoodItem>) => {
    if (!result) return

    const updatedItems = result.items.map(item =>
      item.id === id ? { ...item, ...data, edited: true } : item
    )

    const newTotals = recalculateTotals(updatedItems)
    const newConfidence = calculateOverallConfidence(updatedItems)

    setResult({
      ...result,
      items: updatedItems,
      totals: newTotals,
      confidence: newConfidence
    })
  }, [result])

  // Remover item
  const removeItem = useCallback((id: string) => {
    if (!result) return

    const updatedItems = result.items.filter(item => item.id !== id)
    const newTotals = recalculateTotals(updatedItems)
    const newConfidence = calculateOverallConfidence(updatedItems)

    setResult({
      ...result,
      items: updatedItems,
      totals: newTotals,
      confidence: newConfidence
    })
  }, [result])

  // Adicionar item
  const addItem = useCallback((item: Omit<AnalyzedFoodItem, 'id'>) => {
    if (!result) return

    const newItem: AnalyzedFoodItem = {
      ...item,
      id: `item-${Date.now()}`,
      edited: true
    }

    const updatedItems = [...result.items, newItem]
    const newTotals = recalculateTotals(updatedItems)
    const newConfidence = calculateOverallConfidence(updatedItems)

    setResult({
      ...result,
      items: updatedItems,
      totals: newTotals,
      confidence: newConfidence
    })
  }, [result])

  // Obter resultado atualizado
  const getUpdatedResult = useCallback(() => {
    return result
  }, [result])

  return {
    status,
    isAnalyzing,
    result,
    error,
    imagePreview,
    analyzeImage,
    clearResult,
    setImagePreview,
    updateItem,
    removeItem,
    addItem,
    getUpdatedResult
  }
}

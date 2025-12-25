import type { AnalysisAPIResponse, MealAnalysisResult, AnalyzedFoodItem } from '@/types/analysis'

/**
 * Limpa e parseia a resposta da IA
 */
export function parseAIResponse(content: string): AnalysisAPIResponse {
  try {
    // Remover markdown se houver
    let jsonContent = content.trim()

    // Remover blocos de código markdown
    if (jsonContent.includes('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.includes('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    // Remover espaços extras
    jsonContent = jsonContent.trim()

    // Parsear JSON
    const parsed = JSON.parse(jsonContent)

    return parsed as AnalysisAPIResponse
  } catch (error) {
    console.error('Erro ao parsear resposta da IA:', error)
    console.error('Conteúdo recebido:', content)

    return {
      success: false,
      error: 'Erro ao processar resposta da IA. Tente novamente.'
    }
  }
}

/**
 * Converte resposta da API para o formato usado internamente
 */
export function convertToMealAnalysisResult(response: AnalysisAPIResponse): MealAnalysisResult {
  if (!response.success) {
    return {
      success: false,
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      suggestions: [],
      warnings: [],
      error: response.error || 'Falha na análise'
    }
  }

  // Adicionar IDs únicos aos itens
  const itemsWithIds: AnalyzedFoodItem[] = (response.items || []).map((item, index) => ({
    ...item,
    id: `item-${Date.now()}-${index}`,
    edited: false
  }))

  // Calcular confiança geral
  const confidence = calculateOverallConfidence(itemsWithIds)

  return {
    success: true,
    meal_description: response.meal_description,
    items: itemsWithIds,
    totals: response.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    suggestions: response.suggestions || [],
    warnings: response.warnings || [],
    confidence
  }
}

/**
 * Calcula confiança geral baseada nos itens
 */
export function calculateOverallConfidence(items: AnalyzedFoodItem[]): number {
  if (items.length === 0) return 0

  const confidenceValues: Record<string, number> = {
    alto: 90,
    medio: 60,
    baixo: 30
  }

  const totalConfidence = items.reduce((sum, item) => {
    return sum + (confidenceValues[item.confidence] || 50)
  }, 0)

  return Math.round(totalConfidence / items.length)
}

/**
 * Recalcula totais baseado nos itens
 */
export function recalculateTotals(items: AnalyzedFoodItem[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

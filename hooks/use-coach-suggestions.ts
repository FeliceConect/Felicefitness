'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  CoachSuggestion,
  DailyBriefing,
  UseCoachSuggestionsReturn,
  SuggestionsResponse,
} from '@/types/coach'
import { QUICK_SUGGESTIONS } from '@/types/coach'

export function useCoachSuggestions(): UseCoachSuggestionsReturn {
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>(QUICK_SUGGESTIONS)
  const [contextualSuggestions, setContextualSuggestions] = useState<CoachSuggestion[]>([])
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSuggestions = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/coach/suggestions')

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: SuggestionsResponse = await response.json()

      setQuickSuggestions(data.quickSuggestions || QUICK_SUGGESTIONS)
      setContextualSuggestions(data.contextualSuggestions || [])
      setDailyBriefing(data.dailyBriefing || null)
    } catch (err) {
      console.error('Error fetching suggestions:', err)
      // Keep default quick suggestions on error
      setQuickSuggestions(QUICK_SUGGESTIONS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSuggestions()
  }, [refreshSuggestions])

  return {
    quickSuggestions,
    contextualSuggestions,
    dailyBriefing,
    isLoading,
    refreshSuggestions,
  }
}

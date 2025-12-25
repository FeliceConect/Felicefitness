'use client'

import { useState, useCallback } from 'react'
import type { AIReport } from '@/types/insights'

interface UseAIAnalysisReturn {
  // Relatório
  report: AIReport | null
  weeklyDigest: AIReport | null

  // Ações
  generateReport: (type: 'weekly' | 'monthly' | 'custom') => Promise<void>
  loadWeeklyDigest: () => Promise<void>

  // Status
  loading: boolean
  error: string | null
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [report, setReport] = useState<AIReport | null>(null)
  const [weeklyDigest, setWeeklyDigest] = useState<AIReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gerar relatório
  const generateReport = useCallback(async (type: 'weekly' | 'monthly' | 'custom') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/insights/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      const data = await response.json()

      const mappedReport: AIReport = {
        id: data.id || `report_${Date.now()}`,
        userId: data.userId || '',
        type: data.type || type,
        periodStart: new Date(data.periodStart || Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(data.periodEnd || Date.now()),
        summary: data.summary || '',
        highlights: data.highlights || [],
        warnings: data.warnings || [],
        recommendations: data.recommendations || [],
        score: data.score || 0,
        sections: data.sections || [],
        createdAt: new Date(data.createdAt || Date.now()),
      }

      setReport(mappedReport)

      if (type === 'weekly') {
        setWeeklyDigest(mappedReport)
      }
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar resumo semanal mais recente
  const loadWeeklyDigest = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/insights/report?type=weekly')

      if (response.ok) {
        const data = await response.json()

        if (data) {
          const mappedReport: AIReport = {
            id: data.id || `report_${Date.now()}`,
            userId: data.userId || '',
            type: 'weekly',
            periodStart: new Date(data.periodStart || Date.now() - 7 * 24 * 60 * 60 * 1000),
            periodEnd: new Date(data.periodEnd || Date.now()),
            summary: data.summary || '',
            highlights: data.highlights || [],
            warnings: data.warnings || [],
            recommendations: data.recommendations || [],
            score: data.score || 0,
            sections: data.sections || [],
            createdAt: new Date(data.createdAt || Date.now()),
          }

          setWeeklyDigest(mappedReport)
        }
      }
    } catch (err) {
      console.error('Error loading weekly digest:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    report,
    weeklyDigest,
    generateReport,
    loadWeeklyDigest,
    loading,
    error,
  }
}

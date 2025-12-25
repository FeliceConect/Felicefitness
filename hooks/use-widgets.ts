'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WidgetConfig, WidgetType, WidgetSize, WidgetLayout, DEFAULT_WIDGETS } from '@/types/widgets'

interface UseWidgetsReturn {
  // Widgets ativos
  activeWidgets: WidgetConfig[]
  availableWidgets: typeof DEFAULT_WIDGETS

  // Reordenar
  reorderWidgets: (widgets: WidgetConfig[]) => void

  // Adicionar/remover
  addWidget: (widgetType: WidgetType, size?: WidgetSize) => void
  removeWidget: (widgetId: string) => void

  // Toggle
  toggleWidget: (widgetId: string, enabled: boolean) => void

  // Atualizar configurações
  updateWidgetConfig: (widgetId: string, config: Partial<WidgetConfig>) => void

  // Salvar
  saveLayout: () => Promise<void>

  loading: boolean
}

const DEFAULT_ACTIVE_WIDGETS: WidgetConfig[] = [
  { id: 'daily-progress-1', type: 'daily-progress', size: 'medium', enabled: true, order: 0 },
  { id: 'water-1', type: 'water', size: 'small', enabled: true, order: 1 },
  { id: 'streak-1', type: 'streak', size: 'small', enabled: true, order: 2 },
  { id: 'revolade-1', type: 'revolade', size: 'medium', enabled: true, order: 3 },
  { id: 'workout-1', type: 'workout', size: 'medium', enabled: true, order: 4 },
]

const STORAGE_KEY = 'felicefit-widgets'

export function useWidgets(): UseWidgetsReturn {
  const [activeWidgets, setActiveWidgets] = useState<WidgetConfig[]>(DEFAULT_ACTIVE_WIDGETS)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Carregar layout do usuário
  useEffect(() => {
    const loadLayout = async () => {
      try {
        // Primeiro, tenta carregar do localStorage para UX rápida
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as WidgetLayout
          setActiveWidgets(parsed.widgets)
        }

        // Depois, sincroniza com o servidor
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = (await supabase
            .from('fitness_profiles')
            .select('widget_layout')
            .eq('id', user.id)
            .single()) as { data: { widget_layout: WidgetLayout | null } | null }

          if (profile?.widget_layout) {
            const layout = profile.widget_layout
            setActiveWidgets(layout.widgets)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
          }
        }
      } catch (error) {
        console.error('Error loading widget layout:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLayout()
  }, [supabase])

  // Reordenar widgets
  const reorderWidgets = useCallback((widgets: WidgetConfig[]) => {
    const reordered = widgets.map((w, i) => ({ ...w, order: i }))
    setActiveWidgets(reordered)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: reordered, lastUpdated: new Date() }))
  }, [])

  // Adicionar widget
  const addWidget = useCallback((widgetType: WidgetType, size: WidgetSize = 'medium') => {
    const newWidget: WidgetConfig = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      size,
      enabled: true,
      order: activeWidgets.length,
    }
    const updated = [...activeWidgets, newWidget]
    setActiveWidgets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: updated, lastUpdated: new Date() }))
  }, [activeWidgets])

  // Remover widget
  const removeWidget = useCallback((widgetId: string) => {
    const updated = activeWidgets
      .filter((w) => w.id !== widgetId)
      .map((w, i) => ({ ...w, order: i }))
    setActiveWidgets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: updated, lastUpdated: new Date() }))
  }, [activeWidgets])

  // Toggle widget
  const toggleWidget = useCallback((widgetId: string, enabled: boolean) => {
    const updated = activeWidgets.map((w) =>
      w.id === widgetId ? { ...w, enabled } : w
    )
    setActiveWidgets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: updated, lastUpdated: new Date() }))
  }, [activeWidgets])

  // Atualizar configurações
  const updateWidgetConfig = useCallback((widgetId: string, config: Partial<WidgetConfig>) => {
    const updated = activeWidgets.map((w) =>
      w.id === widgetId ? { ...w, ...config } : w
    )
    setActiveWidgets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: updated, lastUpdated: new Date() }))
  }, [activeWidgets])

  // Salvar no servidor
  const saveLayout = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const layout: WidgetLayout = {
        widgets: activeWidgets,
        quickActions: [],
        lastUpdated: new Date(),
      }

      await supabase
        .from('fitness_profiles')
        .update({ widget_layout: layout } as never)
        .eq('id', user.id)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch (error) {
      console.error('Error saving widget layout:', error)
    }
  }, [supabase, activeWidgets])

  return {
    activeWidgets,
    availableWidgets: [] as typeof DEFAULT_WIDGETS, // Importar do types
    reorderWidgets,
    addWidget,
    removeWidget,
    toggleWidget,
    updateWidgetConfig,
    saveLayout,
    loading,
  }
}

"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MealItem, MealType } from '@/lib/nutrition/types'

export interface MealTemplateItem {
  nome: string
  food_id: string | null
  quantidade: number
  unidade: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export interface MealTemplate {
  id: string
  name: string
  tipo_refeicao: MealType | null
  items: MealTemplateItem[]
  times_used: number
  created_at: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function mealItemsToTemplateItems(items: MealItem[]): MealTemplateItem[] {
  return items.map(item => ({
    nome: item.food?.nome || 'Alimento',
    food_id: item.food_id && UUID_RE.test(item.food_id) ? item.food_id : null,
    quantidade: item.quantidade,
    unidade: item.food?.unidade || 'g',
    calorias: item.calorias,
    proteinas: item.proteinas,
    carboidratos: item.carboidratos,
    gorduras: item.gorduras,
  }))
}

/**
 * Modelos de refeição do paciente ("Minhas refeições") — reuso com 1 toque.
 * Tabela fitness_meal_templates (RLS own-only, acesso direto via client).
 */
export function useMealTemplates() {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_meal_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('times_used', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error && data) setTemplates(data)
    } catch (err) {
      // Tabela pode não existir ainda (migration pendente) — segue vazio
      console.warn('Modelos de refeição indisponíveis:', err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const saveTemplate = useCallback(async (
    name: string,
    tipo: MealType,
    items: MealItem[]
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_meal_templates')
        .insert({
          user_id: user.id,
          name: name.trim().slice(0, 120),
          tipo_refeicao: tipo,
          items: mealItemsToTemplateItems(items),
        })
        .select()
        .single()
      if (error || !data) return false
      setTemplates(prev => [data, ...prev])
      return true
    } catch {
      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('fitness_meal_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markUsed = useCallback(async (id: string) => {
    const current = templates.find(t => t.id === id)
    if (!current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('fitness_meal_templates')
      .update({ times_used: (current.times_used || 0) + 1 })
      .eq('id', id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates])

  return { templates, loading, saveTemplate, deleteTemplate, markUsed, refresh: load }
}

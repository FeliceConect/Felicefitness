"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Loader2, Apple } from 'lucide-react'
import { toast } from 'sonner'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import type { FoodCategory } from '@/lib/nutrition/types'

interface PendingFood {
  id: string
  nome: string
  categoria: string
  marca: string | null
  porcao_padrao: number
  unidade: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  source: string
  created_at: string
  created_by_name: string | null
}

const CATEGORY_OPTIONS = Object.keys(foodCategoryLabels) as FoodCategory[]

/**
 * Moderação de alimentos criados pelos pacientes.
 * Aprovar promove o alimento ao banco global (todos os pacientes encontram
 * na busca); rejeitar mantém o alimento privado do paciente que criou.
 */
export default function FoodModerationPage() {
  const [foods, setFoods] = useState<PendingFood[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, { nome: string; categoria: string }>>({})

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/food-moderation')
      const data = await res.json()
      if (data.success) setFoods(data.foods || [])
      else toast.error(data.error || 'Erro ao carregar alimentos')
    } catch {
      toast.error('Erro ao carregar alimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const moderate = async (food: PendingFood, action: 'approve' | 'reject') => {
    setProcessing(food.id)
    try {
      const edit = edits[food.id]
      const res = await fetch('/api/portal/food-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: food.id,
          action,
          overrides: edit ? { nome: edit.nome, categoria: edit.categoria } : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setFoods(prev => prev.filter(f => f.id !== food.id))
        toast.success(action === 'approve'
          ? 'Alimento aprovado — agora aparece na busca de todos os pacientes'
          : 'Alimento rejeitado (continua privado do paciente)')
      } else {
        toast.error(data.error || 'Erro ao moderar alimento')
      }
    } catch {
      toast.error('Erro ao moderar alimento')
    } finally {
      setProcessing(null)
    }
  }

  const setEdit = (food: PendingFood, patch: Partial<{ nome: string; categoria: string }>) => {
    setEdits(prev => ({
      ...prev,
      [food.id]: {
        nome: patch.nome ?? prev[food.id]?.nome ?? food.nome,
        categoria: patch.categoria ?? prev[food.id]?.categoria ?? food.categoria,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-dourado animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/portal/nutrition"
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Planos Alimentares
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Alimentos sugeridos</h1>
        <p className="text-foreground-secondary">
          Alimentos cadastrados pelos pacientes. Aprovar adiciona ao banco global — todos passam a encontrar na busca.
        </p>
      </div>

      {foods.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Apple className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground font-medium">Nenhum alimento aguardando moderação</p>
          <p className="text-sm text-foreground-secondary mt-1">
            Quando um paciente cadastrar um alimento que não existe no banco, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {foods.map(food => {
            const edit = edits[food.id]
            return (
              <div key={food.id} className="bg-white rounded-xl border border-border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={edit?.nome ?? food.nome}
                      onChange={(e) => setEdit(food, { nome: e.target.value })}
                      className="w-full font-medium text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dourado"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
                      <select
                        value={edit?.categoria ?? food.categoria}
                        onChange={(e) => setEdit(food, { categoria: e.target.value })}
                        className="bg-background border border-border rounded-lg px-2 py-1 text-sm focus:outline-none"
                      >
                        {CATEGORY_OPTIONS.map(cat => (
                          <option key={cat} value={cat}>{foodCategoryLabels[cat].label}</option>
                        ))}
                      </select>
                      <span>{food.porcao_padrao}{food.unidade}</span>
                      <span>• {Math.round(food.calorias)} kcal</span>
                      <span>• P {food.proteinas}g</span>
                      <span>• C {food.carboidratos}g</span>
                      <span>• G {food.gorduras}g</span>
                      {food.source === 'ai_analysis' && (
                        <span className="px-1.5 py-0.5 text-xs bg-dourado/15 text-dourado rounded">IA</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Criado por {food.created_by_name || 'paciente'} em {new Date(food.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => moderate(food, 'approve')}
                      disabled={processing === food.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {processing === food.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />}
                      Aprovar
                    </button>
                    <button
                      onClick={() => moderate(food, 'reject')}
                      disabled={processing === food.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-background-elevated text-foreground-secondary rounded-lg hover:bg-border transition-colors disabled:opacity-50 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

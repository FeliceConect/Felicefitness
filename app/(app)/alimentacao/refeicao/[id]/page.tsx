"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit2, Trash2, Plus, Clock, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { FoodSearch } from '@/components/alimentacao/food-search'
import { PortionSelector } from '@/components/alimentacao/portion-selector'
import type { Food, MealItem, Meal, MealType } from '@/lib/nutrition/types'
import { mealTypeLabels, mealTypeIcons, foodCategoryLabels } from '@/lib/nutrition/types'
import { calculateFoodMacros } from '@/lib/nutrition/calculations'
import { useFoods } from '@/hooks/use-foods'
import { createClient } from '@/lib/supabase/client'

export default function MealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { addToRecent, toggleFavorite } = useFoods()
  const supabase = createClient()

  const [meal, setMeal] = useState<Meal | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar refeição específica pelo ID
  const loadMeal = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMeal(null)
        return
      }

      // Buscar refeição específica com seus itens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealData, error } = await (supabase as any)
        .from('fitness_meals')
        .select('*, itens:fitness_meal_items(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !mealData) {
        console.error('Error loading meal:', error)
        setMeal(null)
        return
      }

      // Converter itens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convertedItems: MealItem[] = (mealData.itens || []).map((item: any) => ({
        id: item.id,
        food_id: item.food_id || item.id,
        food: {
          id: item.food_id || item.id,
          nome: item.nome_alimento,
          categoria: 'outros' as const,
          porcao_padrao: item.quantidade || 100,
          unidade: (item.unidade || 'g') as 'g' | 'ml' | 'unidade',
          calorias: item.calorias || 0,
          proteinas: item.proteinas || 0,
          carboidratos: item.carboidratos || 0,
          gorduras: item.gorduras || 0
        },
        quantidade: item.quantidade || 100,
        calorias: item.calorias || 0,
        proteinas: item.proteinas || 0,
        carboidratos: item.carboidratos || 0,
        gorduras: item.gorduras || 0
      }))

      setMeal({
        id: mealData.id,
        user_id: mealData.user_id,
        tipo: mealData.tipo_refeicao as MealType,
        data: mealData.data,
        horario_planejado: mealData.horario || undefined,
        horario_real: mealData.horario || undefined,
        status: 'concluido' as const,
        itens: convertedItems,
        calorias_total: mealData.calorias_total || 0,
        proteinas_total: mealData.proteinas_total || 0,
        carboidratos_total: mealData.carboidratos_total || 0,
        gorduras_total: mealData.gorduras_total || 0,
        foto_url: mealData.foto_url || undefined,
        notas: mealData.analise_ia || mealData.notas || undefined,
        created_at: mealData.created_at
      })
    } catch (err) {
      console.error('Error:', err)
      setMeal(null)
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    loadMeal()
  }, [loadMeal])

  const [isEditing, setIsEditing] = useState(false)
  const [editedItems, setEditedItems] = useState<MealItem[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showAddFood, setShowAddFood] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Calculate totals for edited items
  const editedTotals = useMemo(() => {
    return editedItems.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )
  }, [editedItems])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando refeição...</p>
        </div>
      </div>
    )
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Refeição não encontrada</p>
          <Button variant="ghost" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const items = isEditing ? editedItems : meal.itens
  const totals = isEditing ? editedTotals : {
    calorias: meal.calorias_total,
    proteinas: meal.proteinas_total,
    carboidratos: meal.carboidratos_total,
    gorduras: meal.gorduras_total
  }

  const handleStartEdit = () => {
    setEditedItems([...meal.itens])
    setShowAddFood(true) // Abrir seção de adicionar por padrão
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedItems([])
    setIsEditing(false)
    setShowAddFood(false)
    setSelectedFood(null)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // 1. Deletar itens antigos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_meal_items')
        .delete()
        .eq('meal_id', meal.id)

      // 2. Inserir novos itens
      if (editedItems.length > 0) {
        const itemsToInsert = editedItems.map(item => ({
          meal_id: meal.id,
          food_id: item.food_id,
          nome_alimento: item.food.nome,
          quantidade: item.quantidade,
          unidade: item.food.unidade || 'g',
          calorias: item.calorias,
          proteinas: item.proteinas,
          carboidratos: item.carboidratos,
          gorduras: item.gorduras
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('fitness_meal_items')
          .insert(itemsToInsert)
      }

      // 3. Atualizar totais na refeição
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_meals')
        .update({
          calorias_total: editedTotals.calorias,
          proteinas_total: editedTotals.proteinas,
          carboidratos_total: editedTotals.carboidratos,
          gorduras_total: editedTotals.gorduras
        })
        .eq('id', meal.id)

      // 4. Atualizar estado local
      setMeal({
        ...meal,
        itens: editedItems,
        calorias_total: editedTotals.calorias,
        proteinas_total: editedTotals.proteinas,
        carboidratos_total: editedTotals.carboidratos,
        gorduras_total: editedTotals.gorduras
      })

      setIsEditing(false)
      setEditedItems([])
      setShowAddFood(false)
    } catch (error) {
      console.error('Error saving meal:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
  }

  const handlePortionConfirm = (quantity: number) => {
    if (!selectedFood) return

    const macros = calculateFoodMacros(selectedFood, quantity)
    const newItem: MealItem = {
      id: `item-${Date.now()}`,
      food_id: selectedFood.id,
      food: selectedFood,
      quantidade: quantity,
      calorias: macros.calorias,
      proteinas: macros.proteinas,
      carboidratos: macros.carboidratos,
      gorduras: macros.gorduras
    }

    setEditedItems(prev => [...prev, newItem])
    addToRecent(selectedFood.id)
    setSelectedFood(null)
    setShowAddFood(false)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta refeição?')) return

    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Deletar itens da refeição primeiro
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_meal_items')
        .delete()
        .eq('meal_id', meal.id)

      // Deletar a refeição
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_meals')
        .delete()
        .eq('id', meal.id)
        .eq('user_id', user.id)

      router.push('/alimentacao')
    } catch (error) {
      console.error('Error deleting meal:', error)
      setDeleting(false)
    }
  }

  const handleToggleFavorite = () => {
    if (selectedFood) {
      toggleFavorite(selectedFood.id)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mealTypeIcons[meal.tipo]}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {mealTypeLabels[meal.tipo]}
              </h1>
              <p className="text-sm text-slate-400">
                {format(new Date(meal.data), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleStartEdit}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Time info */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {meal.horario_real || meal.horario_planejado}
          </span>
          {meal.horario_planejado && meal.horario_real && meal.horario_planejado !== meal.horario_real && (
            <span className="text-xs text-slate-500">
              (planejado: {meal.horario_planejado})
            </span>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(totals.calorias)}</p>
              <p className="text-xs text-slate-400">kcal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-400">{Math.round(totals.proteinas)}g</p>
              <p className="text-xs text-slate-400">prot</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{Math.round(totals.carboidratos)}g</p>
              <p className="text-xs text-slate-400">carb</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{Math.round(totals.gorduras)}g</p>
              <p className="text-xs text-slate-400">gord</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Alimentos ({items.length})
          </h3>
          {isEditing && (
            <button
              onClick={() => setShowAddFood(true)}
              className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          )}
        </div>

        <div className="space-y-2">
          {items.map((item, index) => {
            const categoryInfo = foodCategoryLabels[item.food.categoria]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-[#14141F] border border-[#2E2E3E] rounded-xl"
              >
                <span className="text-xl">{categoryInfo.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{item.food.nome}</p>
                  <p className="text-sm text-slate-400">
                    {item.quantidade}{item.food.unidade} • {Math.round(item.calorias)} kcal • {Math.round(item.proteinas)}g prot
                  </p>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add food section (when editing) */}
      {isEditing && showAddFood && (
        <div className="px-4 mb-6">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-400">Adicionar Alimento</h4>
              <button
                onClick={() => setShowAddFood(false)}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <FoodSearch
              onSelect={handleFoodSelect}
              excludeIds={editedItems.map(i => i.food_id)}
            />
          </div>
        </div>
      )}

      {/* Photo (placeholder) */}
      {meal.foto_url && (
        <div className="px-4 mb-6">
          <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
            <img
              src={meal.foto_url}
              alt="Foto da refeição"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {meal.notas && (
        <div className="px-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Notas
          </h3>
          <p className="text-slate-300 bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            {meal.notas}
          </p>
        </div>
      )}

      {/* Edit mode actions */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent pt-12">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              <X className="w-5 h-5 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={handleSaveEdit}
              disabled={saving || editedItems.length === 0}
            >
              <Check className="w-5 h-5 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {/* Portion selector modal */}
      {selectedFood && (
        <PortionSelector
          food={selectedFood}
          onConfirm={handlePortionConfirm}
          onCancel={() => setSelectedFood(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  )
}

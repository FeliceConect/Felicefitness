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

  // Tipo para itens do banco
  interface DbMealItem {
    id: string
    food_id?: string | null
    nome_alimento: string
    quantidade?: number | null
    unidade?: string | null
    calorias?: number | null
    proteinas?: number | null
    carboidratos?: number | null
    gorduras?: number | null
  }

  // Carregar refeição específica pelo ID
  const loadMeal = useCallback(async () => {
    setLoading(true)
    console.log('=== CARREGANDO REFEIÇÃO ===')
    console.log('ID:', id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('Usuário não autenticado')
        setMeal(null)
        return
      }
      console.log('User ID:', user.id)

      // Buscar refeição específica
      const { data: mealData, error } = await supabase
        .from('fitness_meals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single() as { data: {
          id: string
          user_id: string | null
          data: string
          tipo_refeicao: string
          horario: string | null
          calorias_total: number | null
          proteinas_total: number | null
          carboidratos_total: number | null
          gorduras_total: number | null
          foto_url: string | null
          analise_ia: string | null
          notas: string | null
          created_at: string
        } | null, error: Error | null }

      if (error || !mealData) {
        console.error('Erro ao carregar refeição:', error)
        setMeal(null)
        return
      }
      console.log('Refeição carregada:', mealData)

      // Buscar itens separadamente - sem filtro de user_id (RLS cuida disso)
      const { data: itemsData, error: itemsError } = await supabase
        .from('fitness_meal_items')
        .select('*')
        .eq('meal_id', id) as { data: DbMealItem[] | null, error: Error | null }

      console.log('=== ITENS DA REFEIÇÃO ===')
      console.log('Query: meal_id =', id)
      console.log('Resultado:', itemsData)
      console.log('Erro:', itemsError)
      console.log('Quantidade:', itemsData?.length || 0)

      // Converter itens
      const convertedItems: MealItem[] = (itemsData || []).map((item: DbMealItem) => ({
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

      console.log('Itens convertidos:', convertedItems)

      setMeal({
        id: mealData.id,
        user_id: mealData.user_id || '',
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

      console.log('=== REFEIÇÃO CARREGADA COM SUCESSO ===')
    } catch (err) {
      console.error('Erro geral:', err)
      setMeal(null)
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    loadMeal()
  }, [loadMeal])

  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false) // Modo complementar - só adiciona sem deletar
  const [editedItems, setEditedItems] = useState<MealItem[]>([])
  const [newItems, setNewItems] = useState<MealItem[]>([]) // Novos itens no modo complementar
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

  // Calculate totals for adding mode (existing + new)
  const addingTotals = useMemo(() => {
    const newTotals = newItems.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )
    return {
      calorias: (meal?.calorias_total || 0) + newTotals.calorias,
      proteinas: (meal?.proteinas_total || 0) + newTotals.proteinas,
      carboidratos: (meal?.carboidratos_total || 0) + newTotals.carboidratos,
      gorduras: (meal?.gorduras_total || 0) + newTotals.gorduras
    }
  }, [meal, newItems])

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

  // Itens a exibir dependendo do modo
  const items = isEditing ? editedItems : isAdding ? [...meal.itens, ...newItems] : meal.itens
  const totals = isEditing ? editedTotals : isAdding ? addingTotals : {
    calorias: meal.calorias_total,
    proteinas: meal.proteinas_total,
    carboidratos: meal.carboidratos_total,
    gorduras: meal.gorduras_total
  }

  // === MODO EDITAR (substitui tudo) ===
  const handleStartEdit = () => {
    setEditedItems([...meal.itens])
    setShowAddFood(true)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedItems([])
    setIsEditing(false)
    setShowAddFood(false)
    setSelectedFood(null)
  }

  // === MODO COMPLEMENTAR (preserva existentes) ===
  const handleStartAdding = () => {
    setNewItems([])
    setShowAddFood(true)
    setIsAdding(true)
  }

  const handleCancelAdding = () => {
    setNewItems([])
    setIsAdding(false)
    setShowAddFood(false)
    setSelectedFood(null)
  }

  const handleSaveAdding = async () => {
    if (newItems.length === 0) return

    setSaving(true)
    console.log('=== SALVANDO ITENS COMPLEMENTARES ===')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // 1. Inserir APENAS os novos itens (preserva os existentes)
      console.log('Inserindo', newItems.length, 'novos itens')
      for (const item of newItems) {
        const isValidUUID = item.food_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.food_id)

        const itemToInsert = {
          meal_id: meal.id,
          food_id: isValidUUID ? item.food_id : null,
          nome_alimento: item.food.nome,
          quantidade: Math.round(item.quantidade),
          unidade: item.food.unidade || 'g',
          calorias: Math.round(item.calorias),
          proteinas: Math.round(item.proteinas),
          carboidratos: Math.round(item.carboidratos),
          gorduras: Math.round(item.gorduras)
        }
        console.log('Inserindo item:', itemToInsert)

        const { error: insertError } = await supabase
          .from('fitness_meal_items')
          .insert(itemToInsert as never)

        if (insertError) {
          console.error('Erro ao inserir item:', insertError)
        }
      }

      // 2. Atualizar totais na refeição
      console.log('Atualizando totais da refeição')
      await supabase
        .from('fitness_meals')
        .update({
          calorias_total: addingTotals.calorias,
          proteinas_total: addingTotals.proteinas,
          carboidratos_total: addingTotals.carboidratos,
          gorduras_total: addingTotals.gorduras
        } as never)
        .eq('id', meal.id)

      // 3. Atualizar estado local
      setMeal({
        ...meal,
        itens: [...meal.itens, ...newItems],
        calorias_total: addingTotals.calorias,
        proteinas_total: addingTotals.proteinas,
        carboidratos_total: addingTotals.carboidratos,
        gorduras_total: addingTotals.gorduras
      })

      console.log('=== ITENS COMPLEMENTARES SALVOS COM SUCESSO ===')
      setIsAdding(false)
      setNewItems([])
      setShowAddFood(false)
    } catch (error) {
      console.error('Erro ao salvar itens:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    console.log('=== SALVANDO EDIÇÃO ===')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // 1. Deletar itens antigos
      console.log('Deletando itens antigos do meal_id:', meal.id)
      const { error: deleteError } = await supabase
        .from('fitness_meal_items')
        .delete()
        .eq('meal_id', meal.id)

      if (deleteError) {
        console.error('Erro ao deletar itens:', deleteError)
      }

      // 2. Inserir novos itens um por um
      if (editedItems.length > 0) {
        console.log('Inserindo', editedItems.length, 'novos itens')
        for (const item of editedItems) {
          // Verificar se food_id é um UUID válido
          const isValidUUID = item.food_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.food_id)

          const itemToInsert = {
            meal_id: meal.id,
            food_id: isValidUUID ? item.food_id : null, // Só envia se for UUID válido
            nome_alimento: item.food.nome,
            quantidade: Math.round(item.quantidade),
            unidade: item.food.unidade || 'g',
            calorias: Math.round(item.calorias),
            proteinas: Math.round(item.proteinas),
            carboidratos: Math.round(item.carboidratos),
            gorduras: Math.round(item.gorduras)
          }
          console.log('Inserindo item:', itemToInsert)

          const { error: insertError } = await supabase
            .from('fitness_meal_items')
            .insert(itemToInsert as never)

          if (insertError) {
            console.error('Erro ao inserir item:', insertError)
          }
        }
      }

      // 3. Atualizar totais na refeição
      console.log('Atualizando totais da refeição')
      await supabase
        .from('fitness_meals')
        .update({
          calorias_total: editedTotals.calorias,
          proteinas_total: editedTotals.proteinas,
          carboidratos_total: editedTotals.carboidratos,
          gorduras_total: editedTotals.gorduras
        } as never)
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

      console.log('=== EDIÇÃO SALVA COM SUCESSO ===')
      setIsEditing(false)
      setEditedItems([])
      setShowAddFood(false)
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    if (isEditing) {
      setEditedItems(prev => prev.filter(item => item.id !== itemId))
    } else if (isAdding) {
      setNewItems(prev => prev.filter(item => item.id !== itemId))
    }
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

    // Adicionar ao array correto dependendo do modo
    if (isEditing) {
      setEditedItems(prev => [...prev, newItem])
    } else if (isAdding) {
      setNewItems(prev => [...prev, newItem])
    }
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

      // Deletar itens da refeição primeiro (CASCADE cuida disso, mas vamos ser explícitos)
      await supabase
        .from('fitness_meal_items')
        .delete()
        .eq('meal_id', meal.id)

      // Deletar a refeição
      await supabase
        .from('fitness_meals')
        .delete()
        .eq('id', meal.id)
        .eq('user_id', user.id)

      router.push('/alimentacao')
    } catch (error) {
      console.error('Erro ao deletar refeição:', error)
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

          {!isEditing && !isAdding && (
            <div className="flex gap-2">
              {/* Botão Adicionar Mais (principal) */}
              <button
                onClick={handleStartAdding}
                className="p-2 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg transition-colors"
                title="Adicionar mais alimentos"
              >
                <Plus className="w-5 h-5 text-violet-400" />
              </button>
              {/* Botão Editar (substituir tudo) */}
              <button
                onClick={handleStartEdit}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Editar refeição"
              >
                <Edit2 className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Excluir refeição"
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
            {isAdding && newItems.length > 0 && (
              <span className="text-emerald-400 ml-2">+{newItems.length} novo(s)</span>
            )}
          </h3>
          {(isEditing || isAdding) && (
            <button
              onClick={() => setShowAddFood(true)}
              className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          )}
        </div>

        {items.length === 0 && !isEditing && !isAdding && meal.calorias_total > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-3">
            <p className="text-amber-400 text-sm">
              Esta refeição foi salva sem detalhes dos alimentos. Clique em editar para adicionar os alimentos.
            </p>
          </div>
        )}

        {/* Indicador de modo complementar */}
        {isAdding && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-3">
            <p className="text-emerald-400 text-sm">
              Modo complementar: os alimentos originais serão preservados. Adicione apenas o que faltou.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => {
            const categoryInfo = foodCategoryLabels[item.food.categoria]
            const isNewItem = isAdding && newItems.some(ni => ni.id === item.id)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isNewItem
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-[#14141F] border border-[#2E2E3E]'
                }`}
              >
                <span className="text-xl">{categoryInfo.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{item.food.nome}</p>
                    {isNewItem && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {item.quantidade}{item.food.unidade} • {Math.round(item.calorias)} kcal • {Math.round(item.proteinas)}g prot
                  </p>
                </div>
                {/* Só permite remover se estiver editando, ou se for novo item no modo adicionar */}
                {(isEditing || (isAdding && isNewItem)) && (
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

      {/* Add food section (when editing or adding) */}
      {(isEditing || isAdding) && showAddFood && (
        <div className="px-4 mb-6">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-400">
                {isAdding ? 'Complementar Refeição' : 'Adicionar Alimento'}
              </h4>
              <button
                onClick={() => setShowAddFood(false)}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <FoodSearch
              onSelect={handleFoodSelect}
              excludeIds={isEditing ? editedItems.map(i => i.food_id) : [...meal.itens.map(i => i.food_id), ...newItems.map(i => i.food_id)]}
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
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent pt-12 z-50">
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

      {/* Adding mode actions */}
      {isAdding && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent pt-12 z-50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleCancelAdding}
              disabled={saving}
            >
              <X className="w-5 h-5 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={handleSaveAdding}
              disabled={saving || newItems.length === 0}
            >
              <Check className="w-5 h-5 mr-2" />
              {saving ? 'Salvando...' : `Salvar +${newItems.length}`}
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

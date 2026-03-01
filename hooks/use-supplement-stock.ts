'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Supplement, StockLevel, UseSupplementStockReturn } from '@/types/supplements'
import { calculateStockLevels } from '@/lib/supplements/calculations'

export function useSupplementStock(): UseSupplementStockReturn {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      const { data: supplementsData, error: supplementsError } = await supabase
        .from('fitness_suplementos')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('ativo', true)
        .order('nome')

      if (supplementsError) throw supplementsError

      const supps = (supplementsData as unknown as Supplement[]) || []
      setSupplements(supps)

      const levels = calculateStockLevels(supps)
      setStockLevels(levels)

    } catch (err) {
      console.error('Error fetching stock:', err)
      setError('Erro ao carregar estoque')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update stock quantity
  const updateStock = async (supplementId: string, quantity: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fitness_suplementos')
        .update({ quantidade_estoque: quantity } as never)
        .eq('id', supplementId)

      if (error) throw error

      await fetchData()
    } catch (err) {
      console.error('Error updating stock:', err)
      throw err
    }
  }

  // Add stock (restock)
  const addStock = async (supplementId: string, amount: number): Promise<void> => {
    try {
      const supplement = supplements.find(s => s.id === supplementId)
      if (!supplement) throw new Error('Suplemento não encontrado')

      const newQuantity = supplement.quantidade_estoque + amount

      const { error } = await supabase
        .from('fitness_suplementos')
        .update({ quantidade_estoque: newQuantity } as never)
        .eq('id', supplementId)

      if (error) throw error

      await fetchData()
    } catch (err) {
      console.error('Error adding stock:', err)
      throw err
    }
  }

  // Get low stock items
  const lowStockItems = stockLevels.filter(s => s.status === 'low' || s.status === 'critical')
  const criticalStockItems = stockLevels.filter(s => s.status === 'critical')

  return {
    stockLevels,
    lowStockItems,
    criticalStockItems,
    isLoading,
    error,
    updateStock,
    addStock,
    refresh: fetchData,
  }
}

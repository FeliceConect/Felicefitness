'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateSP, getCurrentTimeSP } from '@/lib/utils/date'
import { DEFAULT_QUICK_ACTIONS } from '@/types/widgets'
import type { QuickAction } from '@/types/widgets'

interface UseQuickActionsReturn {
  // Ações disponíveis
  actions: QuickAction[]

  // Executar ação
  executeAction: (action: QuickAction) => Promise<void>

  // Executar por ID
  executeById: (actionId: string, params?: Record<string, unknown>) => Promise<void>
}

export function useQuickActions(): UseQuickActionsReturn {
  const router = useRouter()
  const supabase = createClient()

  // Executar ação
  const executeAction = useCallback(async (action: QuickAction) => {
    // Se tem href, navegar
    if (action.href) {
      router.push(action.href)
      return
    }

    // Se tem action, executar
    if (action.action) {
      switch (action.action) {
        case 'add-water': {
          const amount = (action.params?.amount as number) || 250
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = getTodayDateSP()

            // Verificar se já existe registro de hoje
            const { data: existing } = (await supabase
              .from('agua_registros')
              .select('*')
              .eq('user_id', user.id)
              .eq('data', today)
              .single()) as { data: { id: string; quantidade: number } | null }

            if (existing) {
              // Atualizar
              await supabase
                .from('agua_registros')
                .update({ quantidade: existing.quantidade + amount } as never)
                .eq('id', existing.id)
            } else {
              // Criar novo
              await supabase
                .from('agua_registros')
                .insert({
                  user_id: user.id,
                  data: today,
                  quantidade: amount,
                } as never)
            }

            // Opcional: mostrar toast de sucesso
            console.log(`Água adicionada: ${amount}ml`)
          } catch (error) {
            console.error('Error adding water:', error)
          }
          break
        }

        case 'mark-revolade': {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = getTodayDateSP()

            // Buscar suplemento Revolade
            const { data: revolade } = (await supabase
              .from('fitness_supplements')
              .select('id')
              .eq('user_id', user.id)
              .ilike('nome', '%revolade%')
              .single()) as { data: { id: string } | null }

            if (revolade) {
              // Verificar se já tomou hoje
              const { data: existing } = (await supabase
                .from('fitness_supplement_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('suplemento_id', revolade.id)
                .eq('data', today)
                .single()) as { data: { id: string } | null }

              if (!existing) {
                // Registrar tomada
                await supabase
                  .from('fitness_supplement_logs')
                  .insert({
                    user_id: user.id,
                    suplemento_id: revolade.id,
                    data: today,
                    horario: getCurrentTimeSP(),
                    tomado: true,
                  } as never)

                console.log('Revolade marcado como tomado')
              }
            }
          } catch (error) {
            console.error('Error marking revolade:', error)
          }
          break
        }

        case 'start-workout':
          router.push('/treino')
          break

        case 'log-meal':
          router.push('/alimentacao/refeicao/nova')
          break

        default:
          console.log('Unknown action:', action.action)
      }
    }
  }, [router, supabase])

  // Executar por ID
  const executeById = useCallback(async (actionId: string, params?: Record<string, unknown>) => {
    const action = DEFAULT_QUICK_ACTIONS.find((a) => a.id === actionId)
    if (action) {
      await executeAction({ ...action, params: { ...action.params, ...params } })
    }
  }, [executeAction])

  return {
    actions: DEFAULT_QUICK_ACTIONS,
    executeAction,
    executeById,
  }
}

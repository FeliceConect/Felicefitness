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
            const hora = getCurrentTimeSP()

            // Inserir novo log de água (consistente com useWaterLog)
            await supabase
              .from('fitness_water_logs')
              .insert({
                user_id: user.id,
                data: today,
                quantidade_ml: amount,
                horario: hora,
              } as never)
          } catch (error) {
            console.error('Error adding water:', error)
          }
          break
        }

        case 'mark-supplement': {
          router.push('/suplementos')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

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

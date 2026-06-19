import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Garante no máximo UM plano alimentar ativo por cliente.
 *
 * Ao atribuir/criar um plano ativo para um cliente, desativa os demais planos
 * ativos do mesmo cliente (mantendo apenas `keepPlanId`). Isso evita que o
 * paciente fique com vários planos ativos — situação que quebrava a busca do
 * plano no app do paciente e deixava o histórico confuso.
 *
 * É best-effort: erros são logados mas não interrompem o fluxo principal.
 */
export async function deactivateOtherActivePlans(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  clientId: string | null | undefined,
  keepPlanId: string
): Promise<void> {
  if (!clientId) return
  try {
    const { error } = await admin
      .from('fitness_meal_plans')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('is_active', true)
      .neq('id', keepPlanId)
    if (error) {
      console.error('Erro ao desativar planos antigos do cliente:', error)
    }
  } catch (err) {
    console.error('Falha ao garantir plano único ativo:', err)
  }
}

import { createClient } from '@supabase/supabase-js'

// Preços da OpenAI (por 1M tokens) - atualizado em Dez 2024
const PRICING = {
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4-vision-preview': { input: 10.00, output: 30.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
} as const

type ModelName = keyof typeof PRICING

interface LogApiUsageParams {
  userId: string
  feature: string
  model: string
  tokensInput: number
  tokensOutput: number
  endpoint?: string
  metadata?: Record<string, unknown>
}

/**
 * Calcula o custo em USD baseado no modelo e tokens
 */
export function calculateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  // Normalizar nome do modelo
  let modelKey: ModelName = 'gpt-4-turbo'

  if (model.includes('gpt-4o-mini')) {
    modelKey = 'gpt-4o-mini'
  } else if (model.includes('gpt-4o')) {
    modelKey = 'gpt-4o'
  } else if (model.includes('gpt-4-vision')) {
    modelKey = 'gpt-4-vision-preview'
  } else if (model.includes('gpt-4-turbo')) {
    modelKey = 'gpt-4-turbo'
  } else if (model.includes('gpt-4')) {
    modelKey = 'gpt-4'
  } else if (model.includes('gpt-3.5')) {
    modelKey = 'gpt-3.5-turbo'
  }

  const pricing = PRICING[modelKey]

  // Calcular custo (preço é por 1M tokens)
  const inputCost = (tokensInput / 1_000_000) * pricing.input
  const outputCost = (tokensOutput / 1_000_000) * pricing.output

  return inputCost + outputCost
}

/**
 * Registra uso de API no banco de dados
 * Usa service role para bypass de RLS
 */
export async function logApiUsage(params: LogApiUsageParams): Promise<void> {
  try {
    // Criar client admin para bypass de RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const cost = calculateCost(params.model, params.tokensInput, params.tokensOutput)

    const { error } = await supabaseAdmin
      .from('fitness_api_usage')
      .insert({
        user_id: params.userId,
        feature: params.feature,
        model: params.model,
        endpoint: params.endpoint,
        tokens_input: params.tokensInput,
        tokens_output: params.tokensOutput,
        cost_usd: cost,
        metadata: params.metadata
      })

    if (error) {
      console.error('Erro ao registrar uso de API:', error)
    }
  } catch (error) {
    // Não quebrar a aplicação se o log falhar
    console.error('Erro ao registrar uso de API:', error)
  }
}

/**
 * Registra uma ação no log de auditoria
 */
export async function logAuditAction(params: {
  userId: string
  action: string
  targetType?: string
  targetId?: string
  targetUserId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error } = await supabaseAdmin
      .from('fitness_audit_log')
      .insert({
        user_id: params.userId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        target_user_id: params.targetUserId,
        metadata: params.metadata,
        ip_address: params.ipAddress,
        user_agent: params.userAgent
      })

    if (error) {
      console.error('Erro ao registrar auditoria:', error)
    }
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
  }
}

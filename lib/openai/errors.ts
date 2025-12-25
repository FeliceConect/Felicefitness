/**
 * Tratamento de erros da API OpenAI
 */

export interface OpenAIError {
  code?: string
  message?: string
  type?: string
  status?: number
}

/**
 * Converte erros da OpenAI em mensagens amigáveis
 */
export function handleAnalysisError(error: unknown): string {
  // Erro com código específico
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as OpenAIError

    switch (err.code) {
      case 'insufficient_quota':
        return 'Limite de uso da IA atingido. Tente novamente mais tarde.'

      case 'content_policy_violation':
        return 'A imagem não pode ser analisada. Envie uma foto de comida.'

      case 'invalid_api_key':
        return 'Erro de configuração. Entre em contato com o suporte.'

      case 'rate_limit_exceeded':
        return 'Muitas solicitações. Aguarde um momento e tente novamente.'

      case 'model_not_found':
        return 'Modelo de IA indisponível. Tente novamente mais tarde.'

      default:
        break
    }
  }

  // Erro de timeout
  if (error instanceof Error) {
    if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ECONNRESET')
    ) {
      return 'A análise demorou muito. Tente com uma imagem menor.'
    }

    // Erro de parsing JSON
    if (error instanceof SyntaxError) {
      return 'Erro ao processar resultado. Tente novamente.'
    }

    // Erro de rede
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
  }

  // Erro genérico
  return 'Erro na análise. Por favor, tente novamente.'
}

/**
 * Verifica se é um erro recuperável (pode tentar novamente)
 */
export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as OpenAIError
    const retryableCodes = ['rate_limit_exceeded', 'timeout', 'ETIMEDOUT', 'ECONNRESET']
    return retryableCodes.includes(err.code || '')
  }

  if (error instanceof Error) {
    return (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('ECONNRESET')
    )
  }

  return false
}

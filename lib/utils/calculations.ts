import { parseTimeString } from './date'

/**
 * Status do medicamento Revolade
 */
export type RevoladeStatus =
  | 'antes_jejum'    // Antes do período de jejum
  | 'jejum'          // No período de jejum (não comer)
  | 'tomar_agora'    // Hora de tomar (janela de 30min)
  | 'restricao'      // Após tomar, evitar laticínios
  | 'liberado'       // Pode comer normalmente
  | 'nao_configurado' // Usuário não usa medicamento

export interface RevoladeConfig {
  usaMedicamento: boolean
  horario: string              // "14:00"
  jejumAntesHoras: number      // 2
  restricaoDepoisHoras: number // 4
  restricaoTipo: string        // "laticínios"
  tomadoHoje: boolean
}

export interface RevoladeStatusInfo {
  status: RevoladeStatus
  mensagem: string
  tempoRestante?: number // em minutos
  horarioLiberacao?: string
}

/**
 * Calcula o status atual do Revolade
 */
export function getRevoladeStatus(config: RevoladeConfig): RevoladeStatusInfo {
  if (!config.usaMedicamento) {
    return { status: 'nao_configurado', mensagem: '' }
  }

  const now = new Date()
  const horarioTomar = parseTimeString(config.horario)
  const horarioInicioJejum = new Date(horarioTomar.getTime() - config.jejumAntesHoras * 60 * 60 * 1000)
  const horarioFimRestricao = new Date(horarioTomar.getTime() + config.restricaoDepoisHoras * 60 * 60 * 1000)

  // Se já tomou hoje
  if (config.tomadoHoje) {
    if (now < horarioFimRestricao) {
      const minutosRestantes = Math.round((horarioFimRestricao.getTime() - now.getTime()) / (1000 * 60))
      const horaLiberacao = horarioFimRestricao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return {
        status: 'restricao',
        mensagem: `Sem ${config.restricaoTipo} até ${horaLiberacao}`,
        tempoRestante: minutosRestantes,
        horarioLiberacao: horaLiberacao
      }
    }
    return {
      status: 'liberado',
      mensagem: 'Pode comer normalmente'
    }
  }

  // Ainda não tomou
  if (now < horarioInicioJejum) {
    const minutosAteJejum = Math.round((horarioInicioJejum.getTime() - now.getTime()) / (1000 * 60))
    const horaJejum = horarioInicioJejum.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return {
      status: 'antes_jejum',
      mensagem: `Jejum começa às ${horaJejum}`,
      tempoRestante: minutosAteJejum
    }
  }

  if (now >= horarioInicioJejum && now < horarioTomar) {
    const minutosAteTomar = Math.round((horarioTomar.getTime() - now.getTime()) / (1000 * 60))
    return {
      status: 'jejum',
      mensagem: 'Manter jejum',
      tempoRestante: minutosAteTomar
    }
  }

  // Hora de tomar (janela de 30min após horário)
  const janelaFim = new Date(horarioTomar.getTime() + 30 * 60 * 1000)
  if (now >= horarioTomar && now < janelaFim) {
    return {
      status: 'tomar_agora',
      mensagem: 'Tomar agora!'
    }
  }

  // Passou do horário
  return {
    status: 'liberado',
    mensagem: 'Medicamento não tomado hoje'
  }
}

/**
 * Calcula a pontuação diária (0-100)
 */
export interface DailyScoreData {
  treinoConcluido: boolean
  alimentacaoPercent: number    // 0-1
  aguaPercent: number           // 0-1
  sonoRegistrado: boolean
}

export function calculateDailyScore(data: DailyScoreData): number {
  let score = 0

  // Treino: 30 pontos
  if (data.treinoConcluido) score += 30

  // Alimentação: até 30 pontos
  score += Math.min(data.alimentacaoPercent, 1) * 30

  // Água: até 25 pontos
  score += Math.min(data.aguaPercent, 1) * 25

  // Sono: 15 pontos
  if (data.sonoRegistrado) score += 15

  return Math.round(score)
}

/**
 * Calcula porcentagem de progresso de água
 */
export function calculateWaterProgress(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(current / goal, 1)
}

/**
 * Calcula porcentagem de progresso de calorias
 */
export function calculateCaloriesProgress(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(current / goal, 1)
}

/**
 * Retorna a cor baseada no progresso
 */
export function getProgressColor(percent: number): string {
  if (percent < 0.5) return '#EF4444'   // Vermelho
  if (percent < 0.8) return '#F59E0B'   // Amarelo
  if (percent < 1) return '#10B981'     // Verde
  return '#06B6D4'                       // Cyan (100%)
}

/**
 * Retorna a cor do streak
 */
export function getStreakColor(days: number): string {
  if (days === 0) return '#64748B'      // Cinza
  if (days < 7) return '#F59E0B'        // Amarelo
  if (days < 30) return '#EF4444'       // Laranja/Vermelho (fogo)
  return '#8B5CF6'                       // Roxo (épico)
}

/**
 * Calcula calorias restantes
 */
export function calculateRemainingCalories(consumed: number, goal: number): number {
  return Math.max(0, goal - consumed)
}

/**
 * Verifica se é dia de descanso
 */
export function isRestDay(workoutDays: string[], currentDay: string): boolean {
  return !workoutDays.includes(currentDay.toLowerCase())
}

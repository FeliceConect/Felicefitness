// Coach action parser and executor

import type { CoachAction, CoachActionType } from '@/types/coach'

// Extract actions from message in format [ACTION:type:params]
export function extractActions(message: string): CoachAction[] {
  const actionRegex = /\[ACTION:(\w+):?([^\]]*)\]/g
  const actions: CoachAction[] = []

  let match
  while ((match = actionRegex.exec(message)) !== null) {
    const type = match[1] as CoachActionType
    const params = match[2] || undefined

    actions.push({
      type,
      params,
      label: getActionLabel(type, params),
    })
  }

  return actions
}

// Remove action tags from message for display
export function removeActionTags(message: string): string {
  return message.replace(/\[ACTION:[^\]]+\]/g, '').trim()
}

// Get human-readable label for action
function getActionLabel(type: CoachActionType, params?: string): string {
  switch (type) {
    case 'log_water':
      return params ? `Registrar ${params}ml de água` : 'Registrar água'
    case 'start_workout':
      return 'Iniciar treino'
    case 'log_meal':
      return params ? `Registrar ${params}` : 'Registrar refeição'
    case 'show_report':
      return params ? `Ver relatório ${params}` : 'Ver relatório'
    case 'adjust_goal':
      return 'Ajustar meta'
    case 'log_supplement':
      return 'Registrar suplemento'
    case 'show_history':
      return 'Ver histórico'
    case 'navigate':
      return getNavigationLabel(params)
    default:
      return 'Executar ação'
  }
}

function getNavigationLabel(page?: string): string {
  const labels: Record<string, string> = {
    treino: 'Ir para Treino',
    alimentacao: 'Ir para Alimentação',
    agua: 'Ir para Água',
    sono: 'Ir para Sono',
    suplementos: 'Ir para Suplementos',
    corpo: 'Ir para Corpo',
    dashboard: 'Ir para Dashboard',
    relatorios: 'Ver Relatórios',
  }
  return labels[page || ''] || 'Navegar'
}

// Get route for action
export function getActionRoute(action: CoachAction): string | null {
  switch (action.type) {
    case 'start_workout':
      return action.params ? `/treino/${action.params}` : '/treino'
    case 'log_meal':
      return '/alimentacao/refeicao/nova'
    case 'log_water':
      return '/agua'
    case 'show_report':
      return action.params ? `/relatorios/${action.params}` : '/relatorios'
    case 'log_supplement':
      return '/suplementos'
    case 'show_history':
      return action.params ? `/${action.params}/historico` : '/dashboard'
    case 'navigate':
      return action.params ? `/${action.params}` : '/dashboard'
    default:
      return null
  }
}

// Execute action (for actions that require API calls)
export async function executeAction(action: CoachAction): Promise<boolean> {
  switch (action.type) {
    case 'log_water':
      if (action.params) {
        // Would call water logging API
        console.log(`Logging ${action.params}ml of water`)
        return true
      }
      return false

    default:
      return false
  }
}

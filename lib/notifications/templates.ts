import type { NotificationPayload, NotificationType } from '@/types/notifications'

// Templates de notificação por tipo
export const notificationTemplates = {
  // Treino
  treino: {
    lembrete: (treinoNome: string, minutos: number): NotificationPayload => ({
      title: 'Hora do Treino!',
      body: `Seu treino de ${treinoNome} começa em ${minutos} minutos. Prepare-se!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'treino-lembrete',
      url: '/treinos',
      type: 'treino',
      priority: 'high',
      actions: [
        { action: 'iniciar-treino', title: 'Iniciar' },
        { action: 'adiar', title: 'Adiar 15min' }
      ],
      requireInteraction: true
    }),
    concluido: (treinoNome: string, calorias: number): NotificationPayload => ({
      title: 'Treino Concluído!',
      body: `Mandou bem no ${treinoNome}! Você queimou ${calorias} kcal.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'treino-concluido',
      url: '/treinos/historico',
      type: 'treino',
      priority: 'normal',
      actions: [
        { action: 'ver-progresso', title: 'Ver Progresso' }
      ]
    }),
    recordePessoal: (exercicio: string, peso: number): NotificationPayload => ({
      title: 'Novo Recorde!',
      body: `Você bateu seu recorde de ${exercicio}: ${peso}kg! Continue assim!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'treino-recorde',
      url: '/treinos/historico',
      type: 'conquista',
      priority: 'high',
      actions: [
        { action: 'ver-progresso', title: 'Ver Histórico' }
      ]
    })
  },

  // Refeição
  refeicao: {
    lembrete: (tipoRefeicao: string): NotificationPayload => ({
      title: `Hora do ${tipoRefeicao}!`,
      body: 'Não esqueça de registrar sua refeição para acompanhar seus macros.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `refeicao-${tipoRefeicao.toLowerCase().replace(' ', '-')}`,
      url: '/alimentacao/refeicao/nova',
      type: 'refeicao',
      priority: 'normal',
      actions: [
        { action: 'registrar-refeicao', title: 'Registrar' }
      ]
    }),
    metaProteina: (atual: number, meta: number): NotificationPayload => ({
      title: 'Atenção às Proteínas!',
      body: `Você consumiu ${atual}g de ${meta}g de proteína hoje. Faltam ${meta - atual}g.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'refeicao-proteina',
      url: '/alimentacao',
      type: 'refeicao',
      priority: 'normal'
    })
  },

  // Água
  agua: {
    lembrete: (coposHoje: number, metaCopos: number): NotificationPayload => ({
      title: 'Hora de Hidratar!',
      body: `Você bebeu ${coposHoje} de ${metaCopos} copos hoje. Beba mais um agora!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'agua-lembrete',
      url: '/agua',
      type: 'agua',
      priority: 'normal',
      actions: [
        { action: 'tomar-agua', title: 'Bebi!' }
      ]
    }),
    metaAtingida: (litros: number): NotificationPayload => ({
      title: 'Meta de Hidratação!',
      body: `Parabéns! Você atingiu sua meta de ${litros}L de água hoje!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'agua-meta',
      url: '/agua',
      type: 'conquista',
      priority: 'normal'
    })
  },

  // Medicamento (Revolade)
  medicamento: {
    lembrete: (nomeRemedio: string, horario: string): NotificationPayload => ({
      title: 'Hora do Medicamento!',
      body: `Lembrete para tomar ${nomeRemedio} às ${horario}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'medicamento-lembrete',
      url: '/saude',
      type: 'medicamento',
      priority: 'urgent',
      requireInteraction: true,
      actions: [
        { action: 'tomar-remedio', title: 'Tomei!' },
        { action: 'adiar', title: 'Lembrar em 15min' }
      ]
    }),
    tomado: (nomeRemedio: string): NotificationPayload => ({
      title: 'Medicamento Registrado',
      body: `${nomeRemedio} registrado com sucesso. Continue cuidando da sua saúde!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'medicamento-tomado',
      url: '/saude',
      type: 'medicamento',
      priority: 'low',
      silent: true
    })
  },

  // Sono
  sono: {
    horaDormir: (horario: string): NotificationPayload => ({
      title: 'Hora de Descansar!',
      body: `São ${horario}. Prepare-se para dormir e recuperar para o treino de amanhã!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sono-dormir',
      url: '/dashboard',
      type: 'sono',
      priority: 'normal'
    }),
    bomDia: (horasDormidas: number): NotificationPayload => ({
      title: 'Bom Dia, Guerreiro!',
      body: `Você dormiu ${horasDormidas}h. Hora de conquistar mais um dia!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sono-acordar',
      url: '/dashboard',
      type: 'sono',
      priority: 'normal'
    })
  },

  // Conquistas
  conquista: {
    nova: (titulo: string, descricao: string): NotificationPayload => ({
      title: `Nova Conquista: ${titulo}!`,
      body: descricao,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'conquista-nova',
      url: '/conquistas',
      type: 'conquista',
      priority: 'high',
      actions: [
        { action: 'ver-conquista', title: 'Ver Conquista' }
      ]
    }),
    sequencia: (dias: number, tipo: string): NotificationPayload => ({
      title: `${dias} Dias de Sequência!`,
      body: `Você manteve ${dias} dias consecutivos de ${tipo}. Continue assim!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'conquista-sequencia',
      url: '/conquistas',
      type: 'conquista',
      priority: 'normal'
    })
  },

  // Sistema
  sistema: {
    boas_vindas: (nome: string): NotificationPayload => ({
      title: 'Bem-vindo ao FeliceFit!',
      body: `Olá ${nome}! Notificações ativadas. Você receberá lembretes personalizados.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sistema-boas-vindas',
      url: '/dashboard',
      type: 'sistema',
      priority: 'normal'
    }),
    atualizacao: (versao: string): NotificationPayload => ({
      title: 'FeliceFit Atualizado!',
      body: `Nova versão ${versao} disponível com melhorias e novos recursos.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sistema-atualizacao',
      url: '/dashboard',
      type: 'sistema',
      priority: 'low'
    })
  }
}

/**
 * Cria uma notificação customizada
 */
export function createCustomNotification(
  type: NotificationType,
  title: string,
  body: string,
  options?: Partial<NotificationPayload>
): NotificationPayload {
  return {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `${type}-custom`,
    url: '/',
    type,
    priority: 'normal',
    ...options
  }
}

/**
 * Retorna o ícone do tipo de notificação
 */
export function getNotificationTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    treino: '💪',
    refeicao: '🍽️',
    agua: '💧',
    medicamento: '💊',
    sono: '🌙',
    conquista: '🏆',
    lembrete: '⏰',
    sistema: '📱'
  }
  return icons[type] || '📱'
}

/**
 * Retorna a cor do tipo de notificação
 */
export function getNotificationTypeColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    treino: '#8B5CF6', // violet
    refeicao: '#F59E0B', // amber
    agua: '#06B6D4', // cyan
    medicamento: '#EF4444', // red
    sono: '#6366F1', // indigo
    conquista: '#10B981', // emerald
    lembrete: '#F97316', // orange
    sistema: '#6B7280' // gray
  }
  return colors[type] || '#6B7280'
}

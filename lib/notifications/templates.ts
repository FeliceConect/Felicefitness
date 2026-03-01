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

  // Medicamento
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

  // Formulários
  formulario: {
    enviado: (formNome: string, profissionalNome: string): NotificationPayload => ({
      title: 'Novo Formulário Recebido',
      body: `${profissionalNome} enviou o formulário "${formNome}". Preencha antes da sua consulta.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'formulario-enviado',
      url: '/formularios',
      type: 'formulario',
      priority: 'high',
      requireInteraction: true,
      actions: [
        { action: 'preencher', title: 'Preencher Agora' }
      ]
    }),
    lembrete: (formNome: string, prazo: string): NotificationPayload => ({
      title: 'Formulário Pendente',
      body: `Você ainda não preencheu "${formNome}". Prazo: ${prazo}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'formulario-lembrete',
      url: '/formularios',
      type: 'formulario',
      priority: 'high',
      actions: [
        { action: 'preencher', title: 'Preencher' }
      ]
    }),
    preenchido: (formNome: string, clienteNome: string): NotificationPayload => ({
      title: 'Formulário Preenchido!',
      body: `${clienteNome} preencheu o formulário "${formNome}". Veja as respostas.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'formulario-preenchido',
      url: '/portal/forms',
      type: 'formulario',
      priority: 'normal',
      actions: [
        { action: 'ver-respostas', title: 'Ver Respostas' }
      ]
    }),
  },

  // Consultas
  consulta: {
    agendada: (profissional: string, data: string, hora: string): NotificationPayload => ({
      title: 'Consulta Agendada',
      body: `Sua consulta com ${profissional} foi agendada para ${data} às ${hora}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-agendada',
      url: '/agenda',
      type: 'consulta',
      priority: 'high',
      requireInteraction: true,
      actions: [
        { action: 'confirmar', title: 'Confirmar Presença' },
        { action: 'ver-agenda', title: 'Ver Agenda' }
      ]
    }),
    confirmada: (paciente: string): NotificationPayload => ({
      title: 'Consulta Confirmada',
      body: `${paciente} confirmou presença na consulta.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-confirmada',
      url: '/admin/agenda',
      type: 'consulta',
      priority: 'normal'
    }),
    lembrete24h: (profissional: string, hora: string): NotificationPayload => ({
      title: 'Consulta Amanhã',
      body: `Lembrete: Consulta com ${profissional} amanhã às ${hora}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-lembrete-24h',
      url: '/agenda',
      type: 'consulta',
      priority: 'high',
      requireInteraction: true,
      actions: [
        { action: 'confirmar', title: 'Confirmar' },
        { action: 'ver-agenda', title: 'Ver Agenda' }
      ]
    }),
    lembrete1h: (profissional: string): NotificationPayload => ({
      title: 'Consulta em 1h',
      body: `Sua consulta com ${profissional} começa em 1 hora.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-lembrete-1h',
      url: '/agenda',
      type: 'consulta',
      priority: 'high',
      requireInteraction: true
    }),
    lembrete15min: (profissional: string, link?: string): NotificationPayload => ({
      title: 'Consulta em 15min',
      body: `Prepare-se! Consulta com ${profissional} em 15 minutos.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-lembrete-15min',
      url: link || '/agenda',
      type: 'consulta',
      priority: 'urgent',
      requireInteraction: true,
      actions: link
        ? [{ action: 'entrar', title: 'Entrar na Sala' }]
        : [{ action: 'ver-agenda', title: 'Ver Agenda' }]
    }),
    reagendamentoSolicitado: (paciente: string): NotificationPayload => ({
      title: 'Reagendamento Solicitado',
      body: `${paciente} solicitou reagendamento de consulta.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-reagendamento',
      url: '/admin/agenda',
      type: 'consulta',
      priority: 'high',
      requireInteraction: true
    }),
    reagendada: (profissional: string, novaData: string, novaHora: string): NotificationPayload => ({
      title: 'Consulta Reagendada',
      body: `Sua consulta com ${profissional} foi reagendada para ${novaData} às ${novaHora}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-reagendada',
      url: '/agenda',
      type: 'consulta',
      priority: 'high',
      requireInteraction: true
    }),
    cancelada: (profissional: string, data: string): NotificationPayload => ({
      title: 'Consulta Cancelada',
      body: `Sua consulta com ${profissional} em ${data} foi cancelada.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-cancelada',
      url: '/agenda',
      type: 'consulta',
      priority: 'high'
    }),
    realizada: (profissional: string, pontos: number): NotificationPayload => ({
      title: 'Consulta Realizada!',
      body: `Presença confirmada! +${pontos}pts. Obrigado por comparecer à consulta com ${profissional}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'consulta-realizada',
      url: '/agenda',
      type: 'consulta',
      priority: 'normal',
      actions: [
        { action: 'ver-pontos', title: 'Ver Pontuação' }
      ]
    }),
  },

  // Sistema
  sistema: {
    boas_vindas: (nome: string): NotificationPayload => ({
      title: 'Bem-vindo ao Complexo Wellness!',
      body: `Olá ${nome}! Notificações ativadas. Você receberá lembretes personalizados.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sistema-boas-vindas',
      url: '/dashboard',
      type: 'sistema',
      priority: 'normal'
    }),
    atualizacao: (versao: string): NotificationPayload => ({
      title: 'Complexo Wellness Atualizado!',
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
    formulario: '📋',
    consulta: '📅',
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
    formulario: '#8B5CF6', // violet
    consulta: '#c29863', // dourado
    sistema: '#6B7280' // gray
  }
  return colors[type] || '#6B7280'
}

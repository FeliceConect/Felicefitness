// Tipos para Sistema de Notificações Push

export type NotificationType =
  | 'treino'
  | 'refeicao'
  | 'agua'
  | 'medicamento'
  | 'sono'
  | 'conquista'
  | 'lembrete'
  | 'sistema'
  | 'formulario'
  | 'consulta'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  type: NotificationType
  priority?: NotificationPriority
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  data?: Record<string, unknown>
}

export interface NotificationPreferences {
  // Master switch
  enabled: boolean

  // Por tipo
  treino: {
    enabled: boolean
    beforeMinutes: number // minutos antes do treino
  }
  refeicao: {
    enabled: boolean
    times: string[] // horários das refeições
  }
  agua: {
    enabled: boolean
    intervalMinutes: number // intervalo entre lembretes
    startTime: string // início do período
    endTime: string // fim do período
  }
  medicamento: {
    enabled: boolean
    times: string[] // horários dos medicamentos
  }
  sono: {
    enabled: boolean
    bedtimeReminder: string // lembrete para dormir
    wakeupReminder: string // lembrete para acordar
  }
  conquistas: {
    enabled: boolean
  }
  consulta: {
    enabled: boolean
  }

  // Modo silencioso
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface ScheduledNotification {
  id: string
  userId: string
  payload: NotificationPayload
  scheduledFor: Date
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  createdAt: Date
  sentAt?: Date
  error?: string
}

export interface NotificationHistory {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  sentAt: Date
  readAt?: Date
  clickedAt?: Date
  action?: string
}

export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: Date
  lastUsed?: Date
  userAgent?: string
  active: boolean
}

// Default preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  treino: {
    enabled: true,
    beforeMinutes: 30
  },
  refeicao: {
    enabled: true,
    times: ['07:00', '10:00', '12:00', '15:00', '19:00', '21:00']
  },
  agua: {
    enabled: true,
    intervalMinutes: 60,
    startTime: '07:00',
    endTime: '22:00'
  },
  medicamento: {
    enabled: true,
    times: ['09:00']
  },
  sono: {
    enabled: true,
    bedtimeReminder: '22:00',
    wakeupReminder: '06:00'
  },
  conquistas: {
    enabled: true
  },
  consulta: {
    enabled: true
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00'
  }
}

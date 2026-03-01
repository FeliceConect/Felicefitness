import type {
  NotificationPreferences,
  ScheduledNotification,
  NotificationPayload,
  NotificationType
} from '@/types/notifications'
import { notificationTemplates } from './templates'

/**
 * Verifica se está no horário silencioso
 */
export function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours.enabled) return false

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const start = preferences.quietHours.start
  const end = preferences.quietHours.end

  // Se start > end, significa que cruza a meia-noite
  if (start > end) {
    return currentTime >= start || currentTime < end
  }

  return currentTime >= start && currentTime < end
}

/**
 * Verifica se deve enviar notificação baseado nas preferências
 */
export function shouldSendNotification(
  type: NotificationType,
  preferences: NotificationPreferences
): boolean {
  if (!preferences.enabled) return false
  if (isQuietHours(preferences)) return false

  switch (type) {
    case 'treino':
      return preferences.treino.enabled
    case 'refeicao':
      return preferences.refeicao.enabled
    case 'agua':
      return preferences.agua.enabled
    case 'medicamento':
      return preferences.medicamento.enabled
    case 'sono':
      return preferences.sono.enabled
    case 'conquista':
      return preferences.conquistas.enabled
    case 'lembrete':
    case 'sistema':
      return true
    default:
      return true
  }
}

/**
 * Gera os horários de notificação de água para o dia
 */
export function generateWaterReminders(preferences: NotificationPreferences): string[] {
  if (!preferences.agua.enabled) return []

  const times: string[] = []
  const interval = preferences.agua.intervalMinutes
  const [startHour, startMin] = preferences.agua.startTime.split(':').map(Number)
  const [endHour, endMin] = preferences.agua.endTime.split(':').map(Number)

  let currentMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  while (currentMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const mins = currentMinutes % 60
    times.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`)
    currentMinutes += interval
  }

  return times
}

/**
 * Gera os horários de notificação de refeição
 */
export function getMealReminderTimes(preferences: NotificationPreferences): { time: string; tipo: string }[] {
  if (!preferences.refeicao.enabled) return []

  const mealNames: Record<string, string> = {
    '07:00': 'Café da Manhã',
    '10:00': 'Lanche da Manhã',
    '12:00': 'Almoço',
    '15:00': 'Lanche da Tarde',
    '19:00': 'Jantar',
    '21:00': 'Ceia'
  }

  return preferences.refeicao.times.map(time => ({
    time,
    tipo: mealNames[time] || 'Refeição'
  }))
}

/**
 * Calcula próximo horário de notificação para um tipo
 */
export function getNextNotificationTime(
  type: NotificationType,
  preferences: NotificationPreferences
): Date | null {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  switch (type) {
    case 'agua': {
      const times = generateWaterReminders(preferences)
      const nextTime = times.find(t => t > currentTime)
      if (nextTime) {
        const [hours, mins] = nextTime.split(':').map(Number)
        const date = new Date(now)
        date.setHours(hours, mins, 0, 0)
        return date
      }
      return null
    }

    case 'refeicao': {
      const meals = getMealReminderTimes(preferences)
      const nextMeal = meals.find(m => m.time > currentTime)
      if (nextMeal) {
        const [hours, mins] = nextMeal.time.split(':').map(Number)
        const date = new Date(now)
        date.setHours(hours, mins, 0, 0)
        return date
      }
      return null
    }

    case 'medicamento': {
      const nextTime = preferences.medicamento.times.find(t => t > currentTime)
      if (nextTime) {
        const [hours, mins] = nextTime.split(':').map(Number)
        const date = new Date(now)
        date.setHours(hours, mins, 0, 0)
        return date
      }
      return null
    }

    case 'sono': {
      if (preferences.sono.bedtimeReminder > currentTime) {
        const [hours, mins] = preferences.sono.bedtimeReminder.split(':').map(Number)
        const date = new Date(now)
        date.setHours(hours, mins, 0, 0)
        return date
      }
      return null
    }

    default:
      return null
  }
}

/**
 * Cria uma notificação agendada
 */
export function createScheduledNotification(
  userId: string,
  payload: NotificationPayload,
  scheduledFor: Date
): Omit<ScheduledNotification, 'id'> {
  return {
    userId,
    payload,
    scheduledFor,
    status: 'pending',
    createdAt: new Date()
  }
}

/**
 * Gera todas as notificações do dia baseado nas preferências
 */
export function generateDailyNotifications(
  userId: string,
  preferences: NotificationPreferences
): Omit<ScheduledNotification, 'id'>[] {
  const notifications: Omit<ScheduledNotification, 'id'>[] = []
  const today = new Date()

  // Notificações de água
  if (preferences.agua.enabled) {
    const waterTimes = generateWaterReminders(preferences)
    waterTimes.forEach(time => {
      const [hours, mins] = time.split(':').map(Number)
      const scheduledFor = new Date(today)
      scheduledFor.setHours(hours, mins, 0, 0)

      if (scheduledFor > new Date()) {
        notifications.push(createScheduledNotification(
          userId,
          notificationTemplates.agua.lembrete(0, 8), // Será atualizado com dados reais
          scheduledFor
        ))
      }
    })
  }

  // Notificações de refeição
  if (preferences.refeicao.enabled) {
    const meals = getMealReminderTimes(preferences)
    meals.forEach(({ time, tipo }) => {
      const [hours, mins] = time.split(':').map(Number)
      const scheduledFor = new Date(today)
      scheduledFor.setHours(hours, mins, 0, 0)

      if (scheduledFor > new Date()) {
        notifications.push(createScheduledNotification(
          userId,
          notificationTemplates.refeicao.lembrete(tipo),
          scheduledFor
        ))
      }
    })
  }

  // Notificações de medicamento
  if (preferences.medicamento.enabled) {
    preferences.medicamento.times.forEach(time => {
      const [hours, mins] = time.split(':').map(Number)
      const scheduledFor = new Date(today)
      scheduledFor.setHours(hours, mins, 0, 0)

      if (scheduledFor > new Date()) {
        notifications.push(createScheduledNotification(
          userId,
          notificationTemplates.medicamento.lembrete('Medicamento', time),
          scheduledFor
        ))
      }
    })
  }

  // Lembrete para dormir
  if (preferences.sono.enabled && preferences.sono.bedtimeReminder) {
    const [hours, mins] = preferences.sono.bedtimeReminder.split(':').map(Number)
    const scheduledFor = new Date(today)
    scheduledFor.setHours(hours, mins, 0, 0)

    if (scheduledFor > new Date()) {
      notifications.push(createScheduledNotification(
        userId,
        notificationTemplates.sono.horaDormir(preferences.sono.bedtimeReminder),
        scheduledFor
      ))
    }
  }

  return notifications
}

/**
 * Filtra notificações que devem ser enviadas agora
 */
export function getNotificationsDue(
  notifications: ScheduledNotification[],
  toleranceMinutes: number = 5
): ScheduledNotification[] {
  const now = new Date()
  const tolerance = toleranceMinutes * 60 * 1000 // em milissegundos

  return notifications.filter(n => {
    if (n.status !== 'pending') return false

    const scheduledTime = new Date(n.scheduledFor).getTime()
    const diff = now.getTime() - scheduledTime

    // Notificação está no período de tolerância (passou do horário mas dentro do limite)
    return diff >= 0 && diff <= tolerance
  })
}

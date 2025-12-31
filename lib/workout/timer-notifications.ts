// Timer Notification Service
// Gerencia notificações agendadas para o timer de descanso
// Funciona mesmo quando a tela está bloqueada no iOS (PWA)

interface TimerNotificationOptions {
  title?: string
  body?: string
  tag?: string
  requireInteraction?: boolean
}

class TimerNotificationService {
  private scheduledTimeout: NodeJS.Timeout | null = null
  private notificationTag = 'rest-timer-complete'
  private isSupported = false
  private hasPermission = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window
      this.hasPermission = this.isSupported && Notification.permission === 'granted'
    }
  }

  /**
   * Verifica se notificações são suportadas
   */
  get supported(): boolean {
    return this.isSupported
  }

  /**
   * Verifica se temos permissão
   */
  get permitted(): boolean {
    return this.hasPermission
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      this.hasPermission = permission === 'granted'
      return this.hasPermission
    } catch {
      return false
    }
  }

  /**
   * Agenda uma notificação para quando o timer terminar
   * @param seconds - Tempo em segundos até a notificação
   * @param options - Opções da notificação
   */
  scheduleNotification(seconds: number, options?: TimerNotificationOptions): void {
    // Cancelar qualquer notificação agendada anteriormente
    this.cancelScheduledNotification()

    if (!this.isSupported || !this.hasPermission) {
      console.log('[TimerNotification] Não suportado ou sem permissão')
      return
    }

    const title = options?.title || 'Descanso Finalizado!'
    const body = options?.body || 'Hora de voltar ao treino!'
    const tag = options?.tag || this.notificationTag

    console.log(`[TimerNotification] Agendando notificação para ${seconds}s`)

    // Usar setTimeout para agendar a notificação
    // Isso funciona porque vamos manter o app ativo com áudio em background
    this.scheduledTimeout = setTimeout(() => {
      this.showNotification(title, body, tag, options?.requireInteraction ?? true)
    }, seconds * 1000)

    // Também tentar usar o Service Worker para notificações
    // que funcionam mesmo quando o app está em background
    this.scheduleViaServiceWorker(seconds, { title, body, tag })
  }

  /**
   * Cancela a notificação agendada
   */
  cancelScheduledNotification(): void {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout)
      this.scheduledTimeout = null
      console.log('[TimerNotification] Notificação cancelada')
    }

    // Também cancelar via Service Worker
    this.cancelViaServiceWorker()

    // Fechar notificações existentes com a tag do timer
    this.closeExistingNotifications()
  }

  /**
   * Mostra a notificação imediatamente
   */
  private showNotification(
    title: string,
    body: string,
    tag: string,
    requireInteraction: boolean
  ): void {
    try {
      // Tentar via Service Worker primeiro (funciona melhor em background)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_TIMER_NOTIFICATION',
          payload: { title, body, tag, requireInteraction }
        })
        console.log('[TimerNotification] Enviado via Service Worker')
      } else {
        // Fallback: Notification API direta
        // Note: vibrate não está disponível na Notification API padrão
        // Vibração é tratada pelo Service Worker
        const notification = new Notification(title, {
          body,
          tag,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction,
          silent: false
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        console.log('[TimerNotification] Mostrado via Notification API')
      }
    } catch (error) {
      console.error('[TimerNotification] Erro ao mostrar notificação:', error)
    }
  }

  /**
   * Agenda notificação via Service Worker (funciona em background)
   */
  private async scheduleViaServiceWorker(
    seconds: number,
    options: { title: string; body: string; tag: string }
  ): Promise<void> {
    if (!('serviceWorker' in navigator)) return

    try {
      // Aguardar o Service Worker estar pronto
      await navigator.serviceWorker.ready

      // Enviar mensagem para o SW com o tempo de expiração
      const expiresAt = Date.now() + (seconds * 1000)

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_TIMER_NOTIFICATION',
          payload: {
            ...options,
            expiresAt,
            seconds
          }
        })
        console.log('[TimerNotification] Agendado via Service Worker')
      }
    } catch (error) {
      console.error('[TimerNotification] Erro ao agendar via SW:', error)
    }
  }

  /**
   * Cancela notificação via Service Worker
   */
  private cancelViaServiceWorker(): void {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return

    navigator.serviceWorker.controller.postMessage({
      type: 'CANCEL_TIMER_NOTIFICATION'
    })
  }

  /**
   * Fecha notificações existentes do timer
   */
  private async closeExistingNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const notifications = await registration.getNotifications({ tag: this.notificationTag })
      notifications.forEach(n => n.close())
    } catch {
      // Ignore errors
    }
  }

  /**
   * Verifica e solicita permissão se necessário
   */
  async ensurePermission(): Promise<boolean> {
    if (!this.isSupported) return false
    if (this.hasPermission) return true

    return this.requestPermission()
  }
}

// Singleton
export const timerNotificationService = new TimerNotificationService()

// Export types
export type { TimerNotificationOptions }

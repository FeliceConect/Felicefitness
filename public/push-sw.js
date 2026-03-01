// Complexo Wellness Push Notification Service Worker Handler
// This file handles push notifications and should be imported by the main SW

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  let data = {
    title: 'Complexo Wellness',
    body: 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {}
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        ...data,
        ...payload
      }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'felicefit-notification',
    vibrate: [100, 50, 100],
    data: {
      ...data.data,
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  let urlToOpen = data.url || '/'

  // Handle specific actions
  if (action) {
    switch (action) {
      case 'iniciar-treino':
        urlToOpen = '/treinos'
        break
      case 'adiar':
        // Could send a request to reschedule
        return
      case 'registrar-refeicao':
        urlToOpen = '/alimentacao/refeicao/nova'
        break
      case 'ver-progresso':
        urlToOpen = '/dashboard'
        break
      case 'tomar-agua':
        urlToOpen = '/agua'
        break
      case 'tomar-remedio':
        urlToOpen = '/saude'
        break
      case 'ver-conquista':
        urlToOpen = '/conquistas'
        break
      case 'continue':
        // Timer notification - voltar ao treino
        urlToOpen = data.url || '/treino'
        break
      default:
        urlToOpen = data.url || '/'
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Notification close handler (for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed without action')

  const data = event.notification.data || {}

  // Track dismissed notifications
  if (data.type) {
    console.log('[SW] Dismissed notification type:', data.type)
  }
})

// Timer notification state
let timerNotificationTimeout = null
let timerExpiresAt = null

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return

  switch (event.data.type) {
    case 'GET_SUBSCRIPTION':
      event.waitUntil(
        self.registration.pushManager.getSubscription()
          .then((subscription) => {
            event.ports[0].postMessage({ subscription })
          })
      )
      break

    case 'SCHEDULE_TIMER_NOTIFICATION':
      // Agendar notificação do timer
      handleScheduleTimerNotification(event.data.payload)
      break

    case 'CANCEL_TIMER_NOTIFICATION':
      // Cancelar notificação agendada
      handleCancelTimerNotification()
      break

    case 'SHOW_TIMER_NOTIFICATION':
      // Mostrar notificação imediatamente
      handleShowTimerNotification(event.data.payload)
      break
  }
})

// Agendar notificação do timer
function handleScheduleTimerNotification(payload) {
  const { title, body, tag, expiresAt, seconds } = payload

  console.log('[SW] Agendando notificação do timer para', seconds, 'segundos')

  // Cancelar timeout anterior se existir
  if (timerNotificationTimeout) {
    clearTimeout(timerNotificationTimeout)
    timerNotificationTimeout = null
  }

  // Salvar tempo de expiração
  timerExpiresAt = expiresAt

  // Agendar novo timeout
  timerNotificationTimeout = setTimeout(() => {
    showTimerNotification(title, body, tag)
  }, seconds * 1000)
}

// Cancelar notificação agendada
function handleCancelTimerNotification() {
  console.log('[SW] Cancelando notificação do timer')

  if (timerNotificationTimeout) {
    clearTimeout(timerNotificationTimeout)
    timerNotificationTimeout = null
  }

  timerExpiresAt = null

  // Fechar notificações existentes do timer
  self.registration.getNotifications({ tag: 'rest-timer-complete' })
    .then(notifications => {
      notifications.forEach(n => n.close())
    })
}

// Mostrar notificação imediatamente
function handleShowTimerNotification(payload) {
  const { title, body, tag, requireInteraction } = payload
  showTimerNotification(title, body, tag, requireInteraction)
}

// Função para mostrar a notificação do timer
function showTimerNotification(title, body, tag, requireInteraction = true) {
  console.log('[SW] Mostrando notificação do timer:', title)

  // Usar timestamp único para evitar que notificações sejam agrupadas/substituídas
  const uniqueTag = (tag || 'rest-timer-complete') + '-' + Date.now()

  // Configurações otimizadas para iOS
  const options = {
    body: body || 'Hora de voltar ao treino!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: uniqueTag,
    // Vibração: iOS ignora isso, mas Android usa
    vibrate: [200, 100, 200, 100, 400, 100, 200],
    // IMPORTANTE para iOS: não usar requireInteraction (pode impedir notificação)
    requireInteraction: false,
    // silent: false permite som do sistema no iOS
    silent: false,
    // renotify garante nova notificação mesmo com mesma tag
    renotify: true,
    data: {
      type: 'timer',
      url: '/treino',
      timestamp: Date.now()
    },
    // Actions podem não aparecer no iOS, mas incluímos mesmo assim
    actions: [
      {
        action: 'continue',
        title: 'Continuar'
      }
    ]
  }

  // Mostrar notificação
  self.registration.showNotification(title || 'Descanso Finalizado!', options)
    .then(() => {
      console.log('[SW] Notificação do timer mostrada com sucesso')

      // Notificar TODOS os clientes para tocar som (caso app esteja aberto)
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          console.log('[SW] Notificando', clients.length, 'clientes')
          clients.forEach(client => {
            client.postMessage({
              type: 'TIMER_COMPLETE',
              payload: { playSound: true }
            })
          })
        })
    })
    .catch(err => {
      console.error('[SW] Erro ao mostrar notificação:', err)
    })

  // Limpar estado
  timerNotificationTimeout = null
  timerExpiresAt = null
}

// Verificar timer ao iniciar SW (caso tenha sido reiniciado)
self.addEventListener('activate', (event) => {
  // Se havia um timer agendado, verificar se já expirou
  if (timerExpiresAt && Date.now() >= timerExpiresAt) {
    showTimerNotification('Descanso Finalizado!', 'Hora de voltar ao treino!', 'rest-timer-complete')
  }
})

console.log('[SW] Push notification handler loaded (with timer support)')

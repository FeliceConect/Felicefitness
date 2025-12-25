// FeliceFit Push Notification Service Worker Handler
// This file handles push notifications and should be imported by the main SW

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  let data = {
    title: 'FeliceFit',
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

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SUBSCRIPTION') {
    event.waitUntil(
      self.registration.pushManager.getSubscription()
        .then((subscription) => {
          event.ports[0].postMessage({ subscription })
        })
    )
  }
})

console.log('[SW] Push notification handler loaded')

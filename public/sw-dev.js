// Complexo Wellness Development & Fallback Service Worker
// This SW handles push notifications and basic offline support
// Production uses the next-pwa generated SW, but this is the fallback

const CACHE_NAME = 'felicefit-v1'
const OFFLINE_URL = '/offline'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Import push notification handlers
importScripts('/push-sw.js')

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets')
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.warn('[SW] Some assets failed to cache:', err)
        })
      })
      .then(() => {
        console.log('[SW] Skip waiting')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      }),
      // Claim all clients
      clients.claim()
    ]).then(() => {
      console.log('[SW] Activated and claimed all clients')
    })
  )
})

// Fetch event - network first with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(async () => {
          // Try cache first
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Fall back to offline page
          const offlineResponse = await caches.match(OFFLINE_URL)
          if (offlineResponse) {
            return offlineResponse
          }
          // Last resort - return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain' }
          })
        })
    )
    return
  }

  // For static assets - stale while revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request)

        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        }).catch(() => null)

        return cachedResponse || fetchPromise || new Response('', { status: 404 })
      })
    )
    return
  }
})

// Background sync for failed requests (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag)

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Could implement background data sync here
      Promise.resolve()
    )
  }
})

// Periodic background sync (future enhancement)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)

  if (event.tag === 'update-data') {
    event.waitUntil(
      // Could implement periodic data updates here
      Promise.resolve()
    )
  }
})

console.log('[SW] Service Worker loaded - version 1.0')

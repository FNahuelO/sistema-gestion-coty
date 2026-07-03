const CACHE_NAME = 'coty-cafe-offline-v1'
const PRECACHE_URLS = ['/offline', '/manifest.json', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    throw new Error('offline')
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) return

  if (url.pathname === '/api/catalog' || url.pathname === '/api/settings') {
    event.respondWith(networkFirst(event.request))
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        return (await cache.match('/offline')) ?? (await cache.match('/offline', { ignoreSearch: true }))
      })
    )
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Coty Café'
  const options = {
    body: payload.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/order-status' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/order-status'

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

      // Reutilizamos una ventana ya abierta de la app y la llevamos al pedido.
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            if ('navigate' in client) {
              const navigated = await client.navigate(targetUrl)
              return (navigated || client).focus()
            }
          } catch {
            // navigate puede fallar si el cliente no está controlado; usamos focus.
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })()
  )
})

// Web Push service worker (T10). Registered from EnableNotifications.vue and
// served at the site root so it controls the whole origin. Its job is to
// receive pushes the server sends (T11) and surface them as OS notifications.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }
  const title = payload.title || 'New defect filed'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      tag: payload.tag,
      data: { url: payload.url || '/defects' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/defects'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})

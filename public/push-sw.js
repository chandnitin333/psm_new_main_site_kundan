/* Web Push handlers — imported into the generated Workbox service worker
   via vite-plugin-pwa workbox.importScripts. Shows a notification when the
   gram panchayat posts a new सूचना, and opens the notices feed on click. */
/* eslint-disable no-undef */

self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'ग्रामपंचायत सूचना';
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/posts' },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/posts';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if ('focus' in client) {
          try { client.navigate(url); } catch (e) { /* ignore */ }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

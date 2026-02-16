/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  let data = { title: 'ZerTo', body: 'Máte nové upozornění' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback to default
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'zerto-expiration',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// RR GMAO — Service Worker (Push Notifications + Offline Cache)

const CACHE_NAME = 'rr-gmao-v1';

// Pages et assets à mettre en cache pour le mode hors-ligne
const OFFLINE_URLS = [
  '/tech',
  '/tech/login',
  '/nouveau',
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ─── Install : préchargement du cache ─────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS).catch(() => {}))
  );
});

// ─── Activate : nettoyage des anciens caches ──────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch : stratégie Network-first pour les pages tech, Cache-first pour les assets ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP, extensions browser, et API Supabase/n8n
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname !== self.location.hostname) return;
  if (request.method !== 'GET') return;

  // Assets statiques (_next/static) → Cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // Pages tech terrain → Network-first avec fallback cache
  if (url.pathname.startsWith('/tech') || url.pathname === '/nouveau' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/tech')))
    );
    return;
  }
});

// ─── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RR GMAO';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'rr-gmao-notif',
    renotify: true,
    data: { url: data.url || '/tech' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/tech';
  const url = rawUrl.startsWith('http') ? rawUrl : self.location.origin + rawUrl;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

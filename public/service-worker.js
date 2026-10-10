// QuanterraOS Progressive Web App Service Worker
// Version: 2.2.0 (Flight Deck Celestial Shell + Non-Advisory Web Push + Rule B5 Offline Guard)

const CACHE_NAME = 'quanterraos-flightdeck-v2.2';

// Safe static shell assets ONLY.
const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
  '/index.css',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/assets/assistant-avatar.jpg'
];

// Routes that MUST NEVER be cached to prevent stale financial or execution states
const NEVER_CACHE_PREFIXES = [
  '/api/',
  '/stripe'
];

function isNeverCacheUrl(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Install: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Caching failed during install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Prune stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for HTML pages with offline.html fallback; network-only for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for non-GET or cross-origin requests
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // API routes: Strictly network-first with JSON offline fallback (Rule B5 protected)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            status: 'offline',
            message: 'Network offline. Real-time telemetry paused. Rule B5 active ($0.00 capital risk; zero order routing).'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline Guard)',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
          }
        );
      })
    );
    return;
  }

  // HTML Page Navigation: Network-first with offline.html fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html').then((offlineResponse) => {
          return offlineResponse || new Response('Offline — QuanterraOS Flight Deck', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
    return;
  }

  // Never-cache prefixes
  if (isNeverCacheUrl(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static Assets: Cache-first with background network update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Web Push Notifications (Part 0.3 & Part 3.11: Non-Advisory, Zero Win Claims)
self.addEventListener('push', (event) => {
  let data = {
    title: 'QuanterraOS Flight Deck Alert',
    body: 'Settlement basis update: CME CF BRTI 60s TWAP variance detected.',
    url: '/deck?station=navigation'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Sanitize body to strictly adhere to Rule B4 (no win/profit promises)
  let safeBody = data.body || 'Telemetry alert ready for review in Flight Deck.';
  const forbidden = /\b(win|winning|guaranteed|beat the market|profit|edge)\b/gi;
  if (forbidden.test(safeBody)) {
    safeBody = 'Settlement radar and fee drag update ready in Flight Deck.';
  }

  const options = {
    body: safeBody,
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/deck'
    },
    actions: [
      { action: 'open', title: 'Open Cockpit' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/deck';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/deck') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Bishal Codes — Bulletproof Offline Service Worker v5
// Strategy: Cache app shell + Next.js bundles for full offline support

const CACHE_NAME = 'bishalcodes-v5';
const RUNTIME_CACHE = 'bishalcodes-runtime-v5';

// Only cache assets that ACTUALLY EXIST in public/
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-96x96.png',
  '/apple-icon-180x180.png',
  '/android-icon-192x192.png',
  '/512 size.png',
  '/logo.png',
];

// ── INSTALL: Pre-cache essential assets ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual puts so one failure doesn't block everything
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { credentials: 'omit' })).catch((err) => {
            console.warn('[SW] Failed to cache:', url, err);
          })
        )
      );
    })
  );
});

// ── ACTIVATE: Clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ── FETCH: Smart caching strategies ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, blob, data URLs
  if (!url.protocol.startsWith('http')) return;

  // ─── DEVELOPMENT BYPASS: Always hit network on localhost (no caching, no history clears needed) ───
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.')) {
    return;
  }

  // ─── BYPASS: Firebase / Firestore — always network ───
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // ─── BYPASS: Google Analytics, Ads, external APIs ───
  if (
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('googlesyndication.com') ||
    url.hostname.includes('doubleclick.net') ||
    url.hostname.includes('pagead2.googlesyndication.com')
  ) {
    return;
  }

  // ─── CACHE-FIRST: Next.js static bundles (_next/static/) ───
  // These are hashed and immutable — safe to cache permanently
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // ─── STALE-WHILE-REVALIDATE: Fonts & CDN assets ───
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn.tailwindcss.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ─── CACHE-FIRST: Pre-cached static assets (icons, manifest, etc) ───
  if (url.origin === self.location.origin && PRECACHE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }

  // ─── CACHE-FIRST: Images from same origin ───
  if (
    url.origin === self.location.origin &&
    (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // ─── NETWORK-FIRST: Navigation requests (HTML pages) ───
  // Cache the HTML so the app shell works offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: try cached version of this page first
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Then try the home page cache (app shell)
            return caches.match('/').then((homeCache) => {
              if (homeCache) return homeCache;
              // Last resort: offline fallback page
              return caches.match('/offline.html');
            });
          });
        })
    );
    return;
  }

  // ─── NETWORK-FIRST: Everything else (API calls, _next/data, etc) ───
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// ── PUSH & NOTIFICATIONS: System OS Push Notification Handlers ──
self.addEventListener('push', (event) => {
  let data = { title: 'Bishal Codes Broadcast', body: 'New alert received!', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Bishal Codes Broadcast';
  const options = {
    body: data.body || data.message || 'New notification received',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.svg',
    data: {
      url: data.url || data.actionUrl || '/',
      timestamp: data.timestamp || Date.now()
    },
    vibrate: [200, 100, 200],
    tag: data.id || 'push-' + Date.now(),
    renotify: true
  };

  if (data.image || data.fileUrl) {
    options.image = data.image || data.fileUrl;
  }

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn('[SW Push] Error rendering notification banner:', err);
    })
  );
});

// Message listener from foreground client window to trigger SW notification
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SHOW_PUSH_NOTIFICATION' || event.data.type === 'BROADCAST_NOTIFICATION')) {
    const payload = event.data.payload || {};
    const title = payload.title || 'Bishal Codes Alert';
    const options = {
      body: payload.message || payload.body || '',
      icon: '/apple-touch-icon.png',
      badge: '/favicon.svg',
      image: payload.fileUrl || undefined,
      data: { url: payload.actionUrl || '/' },
      vibrate: [200, 100, 200],
      tag: 'push-msg-' + Date.now(),
      renotify: true,
      requireInteraction: true
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Click notification to focus/open app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
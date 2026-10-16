// Service Worker for TI-84 Plus CE PWA (Offline Native-Like Execution)
const CACHE_NAME = 'ti84-ce-v11.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json?v=11.0',
  './assets/app.css?v=11.0',
  './assets/app.js?v=11.0',
  './assets/tn.css',
  './assets/ELG-min.js',
  './assets/No_AppsCE.h84statej',
  './assets/TI84CE_touch.svg',
  './assets/icon-180.png',
  './assets/icon-180.png?v=11.0',
  './assets/icon-192.png',
  './assets/icon-192.png?v=11.0',
  './assets/icon-512.png',
  './assets/icon-512.png?v=11.0',
  './assets/favicon.png',
  './assets/favicon.png?v=11.0'
];

// Install: Cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching v5.0 offline assets');
      await Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('[SW] Pre-cache warning for:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Delete old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for app code (instant updates), Cache-first for large static assets & offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = req.url;

  // App code / HTML / manifest: Try Network first so updates are immediate, fallback to Cache
  const isAppCode = req.mode === 'navigate' || url.includes('app.js') || url.includes('app.css') || url.includes('index.html');

  if (isAppCode) {
    event.respondWith(
      fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkResponse;
      }).catch(() => {
        // Offline / Airplane Mode fallback
        return caches.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('./index.html', { ignoreSearch: true });
          }
        });
      })
    );
  } else {
    // Large static files (ROM, SVG, ELG-min.js, images): Cache-first for instant 0ms speed
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        });
      })
    );
  }
});

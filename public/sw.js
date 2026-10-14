// Central Mall Service Worker (Network-First - Zero Stale Caching)
const CACHE_NAME = 'central-mall-pwa-v3';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge all old caches (v1, v2, etc.) to ensure fresh preview
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always go to network first so UI edits reflect immediately in real time
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache only when network is completely offline
        return caches.match(event.request);
      })
  );
});

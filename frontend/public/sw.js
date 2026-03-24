// PWA Service Worker for offline card functionality
const CACHE_NAME = 'kaynes-card-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        // Cache essential resources for offline use
        return cache.addAll([
          '/',
          '/offline.html',
          '/logo.svg',
          '/favicon.ico',
          '/manifest.json'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', function(event) {
  // Only handle card-related requests
  if (event.request.url.includes('/card/') || event.request.url.includes('/api/card/')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // If successful, cache the response
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          // If offline, try to serve from cache
          return caches.match(event.request)
            .then(function(response) {
              if (response) {
                return response;
              }
              // If no cached response, show offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
  } else {
    // For non-card requests, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          return caches.match(event.request);
        })
    );
  }
});

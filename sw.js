const CACHE_NAME = 'ibrahim-sadaqah-static-v2';
const DYNAMIC_CACHE = 'ibrahim-sadaqah-dynamic-v2';

const STATIC_ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.url.includes('youtube.com') || e.request.url.includes('visitorbadge')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(e.request).then((networkResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(e.request, networkResponse);
          });
        }).catch(() => {}); 
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {});
    })
  );
});

// Fusmar Drive — Service Worker
// Caches the app shell for full offline use

const CACHE = 'fusmar-drive-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache, fall back to network, then cache new responses
self.addEventListener('fetch', function(e) {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      return fetch(e.request).then(function(response) {
        // Cache successful responses for same-origin requests
        if (response && response.status === 200 && response.type === 'basic') {
          var toCache = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, toCache);
          });
        }
        return response;
      }).catch(function() {
        // If both cache and network fail, return the app shell
        return caches.match('./index.html');
      });
    })
  );
});

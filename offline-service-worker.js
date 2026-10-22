self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      // Only clear this worker's own cache: other apps on this origin
      // (e.g. /volti/) keep their offline copies in caches of their own.
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName === 'all';
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        }));
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('all').then(function(cache) {
      return fetch(event.request).then(function(response) {
        if (response.ok) {
          cache.put(event.request, response.clone());
          return response;
        }
        return cache.match(event.request).then(function(cresponse) {
          return cresponse || response;
        });
      });
    }));
});

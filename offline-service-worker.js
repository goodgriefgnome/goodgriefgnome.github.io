self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        }));
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('all').then(function(cache) {
      fetch(event.request).then(function(response) {
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return cache.match(event.request).then(function(cresponse) {
          return cresponse || response;
        });
      });
    }));
});

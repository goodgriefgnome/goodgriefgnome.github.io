// Cache-first app shell so the spike opens with no network.
const CACHE = 'score-spike-v3';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'vendor/pdf.min.js',
  'vendor/pdf.worker.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Share target: PDFs shared from another app arrive here as a form post.
// Park them in IndexedDB; the page moves them into the library on load.
function putInbox(files) {
  return new Promise((res, rej) => {
    const r = indexedDB.open('spike', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => rej(r.error);
    r.onsuccess = () => {
      const t = r.result.transaction('kv', 'readwrite');
      const store = t.objectStore('kv');
      const g = store.get('inbox');
      g.onsuccess = () => store.put([...(g.result || []), ...files], 'inbox');
      t.oncomplete = res;
      t.onerror = () => rej(t.error);
    };
  });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      const form = await e.request.formData();
      const files = form.getAll('pdfs').filter((f) => f instanceof File);
      if (files.length) await putInbox(files);
      return Response.redirect('./?shared=' + files.length, 303);
    })());
    return;
  }
  if (e.request.method !== 'GET') return;
  // The site's root worker clears every cache on the origin when it updates,
  // so refill ours from the network whenever something is missing.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});

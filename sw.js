const CACHE_NAME = 'lvl-books-v12';
const SDK_CACHE = 'lvl-books-sdk-v1';   // Firebase libraries, cached after the first online visit so the app also opens cold with no signal
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME && n !== SDK_CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell; falls back to network, then to the cached
// index.html for navigations so the app still opens with no signal at all.
// Firebase SDK modules from gstatic are cached (cache-first). All other cross-origin requests (Firestore, auth,
// Google Fonts, etc.) are left completely alone.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    event.respondWith(
      caches.open(SDK_CACHE).then((cache) =>
        cache.match(event.request).then((hit) => hit || fetch(event.request).then((res) => { if (res && res.ok) cache.put(event.request, res.clone()); return res; }))
      )
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});

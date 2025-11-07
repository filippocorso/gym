self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  caches.keys().then(keys =>
    keys.forEach(key => caches.delete(key))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});

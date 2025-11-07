self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('gym-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.css',
        '/app.js',
        '/assets/icon.png',
        '/assets/beep.mp3'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});


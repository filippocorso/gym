self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { self.clients.claim(); });

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'playBeep'){
    // Show notification (will vibrate / show depending on platform)
    self.registration.showNotification('Recupero terminato!', {
      body: 'Inizia la prossima serie',
      silent: false
    });
  }
});

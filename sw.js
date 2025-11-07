self.addEventListener("install", () => {
  console.log("Service Worker installato");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("Service Worker attivo");
});

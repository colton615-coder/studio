// Kill-switch Service Worker: unregister any existing worker and refresh clients
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.registration.unregister();
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        // Force reload to detach the old SW
        client.navigate(client.url);
      }
    } catch (e) {
      // no-op
    }
  })());
});

// Ensure no caching interference
self.addEventListener('fetch', (event) => {
  // Let network handle everything; no respondWith
});

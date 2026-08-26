// Probe 1 Service Worker: Push + Periodic Sync + Geolocation test
self.addEventListener('install', (e) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW] Activate');
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (e) => {
  console.log('[SW] Push received');
  if (e.data) {
    console.log('[SW] Push data:', e.data.text());
  }
});

// Periodic Sync handler
self.addEventListener('periodicsync', (e) => {
  console.log('[SW] Periodic sync event:', e.tag);
  if (e.tag === 'location-sync') {
    e.waitUntil(handlePeriodicLocationSync());
  }
});

async function handlePeriodicLocationSync() {
  console.log('[SW] Handling periodic location sync');
  // Notify clients that periodic sync fired
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'PERIODIC_SYNC_FIRED', time: new Date().toISOString() });
  });

  // Try to get geolocation in SW context - THIS SHOULD FAIL
  try {
    // SW has NO geolocation API - this will throw
    const position = await new Promise((resolve, reject) => {
      // navigator.geolocation doesn't exist in SW
      if (!('geolocation' in navigator)) {
        reject(new Error('navigator.geolocation undefined in Service Worker'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
    console.log('[SW] Geolocation succeeded (unexpected):', position.coords);
    clients.forEach(c => c.postMessage({ type: 'GEO_RESULT', success: true, lat: position.coords.latitude, lng: position.coords.longitude }));
  } catch (err) {
    console.log('[SW] Geolocation failed (expected):', err.message);
    clients.forEach(c => c.postMessage({ type: 'GEO_RESULT', success: false, error: err.message }));
  }
}

// Message handler for manual geo test
self.addEventListener('message', (e) => {
  if (e.data.type === 'TEST_GEOLOCATION') {
    console.log('[SW] Manual geolocation test requested');
    handlePeriodicLocationSync();
  }
});

console.log('[SW] Probe 1 SW loaded');
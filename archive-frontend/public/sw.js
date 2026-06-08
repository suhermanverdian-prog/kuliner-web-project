const CACHE_NAME = 'ken-erp-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo-ken.webp'
];

// Install Event: Cache Shell Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [ServiceWorker] Pre-caching Core Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('⚠️ [ServiceWorker] Pre-cache warning:', err.message);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('⚡ [ServiceWorker] Clearing Old Cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Bypass mutative actions, API requests, and web sockets
  if (
    req.method !== 'GET' || 
    req.url.includes('/api/') || 
    req.url.includes('socket.io') ||
    req.url.includes('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        // If valid network response, clone and cache it dynamically
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }

        // SPA Fallback: If requesting HTML route, return index.html
        if (req.headers.get('accept')?.includes('text/html')) {
          const htmlFallback = await caches.match('/index.html');
          if (htmlFallback) return htmlFallback;
        }

        // ✅ Always return a valid Response — prevents "Failed to convert value to 'Response'" error
        return new Response('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

const CACHE_NAME = 'zappy-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate caching strategy, except Network-First for index.html/documents
self.addEventListener('fetch', (event) => {
  // Only intercept local GET requests and avoid API calls
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('localhost') ||
    event.request.url.includes('127.0.0.1') ||
    event.request.url.includes('/admin')
  ) {
    return;
  }

  // Network-First for HTML/document requests to prevent serving stale index.html pointing to deleted chunks
  const isHtmlRequest = 
    event.request.headers.get('accept')?.includes('text/html') || 
    event.request.url === self.location.origin ||
    event.request.url === self.location.origin + '/' ||
    event.request.url.endsWith('.html');

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Zappy Update';
    const options = {
      body: data.message || 'You have a new update.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.payload || {},
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error processing push event:', err);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  let targetUrl = '/';
  
  if (payload.order_id) {
    targetUrl = `/?view=orders&order_id=${payload.order_id}`;
  } else if (payload.type === 'waiter_call') {
    targetUrl = '/waiter-dashboard';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Petflix Service Worker
const CACHE_NAME = 'petflix-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline, network when online
self.addEventListener('fetch', (event) => {
  // Skip caching for:
  // 1. API calls (let them go directly to network)
  // 2. Chrome extensions
  // 3. Non-GET requests
  if (
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension://') ||
    event.request.method !== 'GET'
  ) {
    return; // Let the request go directly to the network
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Network request
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for future offline use
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.log('[ServiceWorker] Fetch failed:', error);
            // Return cached response if available, otherwise let it fail
            return caches.match(event.request);
          });
      })
  );
});

// Track page visibility state (updated via messages from page)
let isPageVisible = false;

// Listen for visibility updates from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VISIBILITY_CHANGE') {
    isPageVisible = event.data.isVisible;
    console.log('[ServiceWorker] Page visibility updated:', isPageVisible);
  }
});

// Check if any client window is currently visible/focused
async function isAnyClientVisible() {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    
    // Check if any client is focused or visible
    for (const client of clients) {
      if (client.focused || (client.visibilityState === 'visible')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[ServiceWorker] Error checking client visibility:', error);
    // Default to showing notification if we can't determine visibility
    return false;
  }
}

// Handle push notifications (when implemented)
self.addEventListener('push', async (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Petflix';
  const options = {
    body: data.body || 'New notification',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: data.tag || 'petflix-notification',
    data: data.url ? { url: data.url } : {},
  };

  // Check if page is visible before showing notification
  const pageVisible = await isAnyClientVisible();
  
  if (pageVisible) {
    console.log('[ServiceWorker] Page is visible - suppressing notification');
    // Don't show notification when user is actively viewing the page
    // The notification bell badge will still update via the API
    return;
  }

  console.log('[ServiceWorker] Page is not visible - showing notification');
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});


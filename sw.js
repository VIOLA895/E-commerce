const CACHE_NAME = "techstore-v1.0.0"
const STATIC_CACHE = "techstore-static-v1.0.0"
const DYNAMIC_CACHE = "techstore-dynamic-v1.0.0"

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
]

// Dynamic assets that will be cached as they're requested
const DYNAMIC_ASSETS = ["/placeholder.svg"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("Service Worker: Static assets cached")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static assets", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker: Activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle different types of requests
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log("Service Worker: Serving from cache", request.url)
          return cachedResponse
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
              return networkResponse
            }

            // Clone the response
            const responseToCache = networkResponse.clone()

            // Determine which cache to use
            const cacheToUse = STATIC_ASSETS.includes(request.url) ? STATIC_CACHE : DYNAMIC_CACHE

            // Cache the response
            caches.open(cacheToUse).then((cache) => {
              console.log("Service Worker: Caching new resource", request.url)
              cache.put(request, responseToCache)
            })

            return networkResponse
          })
          .catch((error) => {
            console.log("Service Worker: Fetch failed, serving offline fallback", error)

            // Return offline fallback for HTML pages
            if (request.headers.get("accept").includes("text/html")) {
              return caches.match("/index.html")
            }

            // Return offline fallback for images
            if (request.headers.get("accept").includes("image")) {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f8f9fa"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6c757d">Offline</text></svg>',
                { headers: { "Content-Type": "image/svg+xml" } },
              )
            }
          })
      }),
    )
  }
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag)

  if (event.tag === "cart-sync") {
    event.waitUntil(syncCart())
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received", event)

  const options = {
    body: event.data ? event.data.text() : "New update available!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Products",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-96x96.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("TechStore", options))
})

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/#products"))
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Helper function to sync cart data
async function syncCart() {
  try {
    // This would typically sync with your backend
    console.log("Service Worker: Syncing cart data...")

    // Get cart data from IndexedDB or localStorage
    const cartData = await getCartData()

    if (cartData && cartData.length > 0) {
      // Sync with server when online
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      })

      if (response.ok) {
        console.log("Service Worker: Cart synced successfully")
        // Clear local pending sync data
        await clearPendingSyncData()
      }
    }
  } catch (error) {
    console.error("Service Worker: Cart sync failed", error)
  }
}

// Helper function to get cart data (placeholder)
async function getCartData() {
  // This would typically get data from IndexedDB
  return []
}

// Helper function to clear pending sync data (placeholder)
async function clearPendingSyncData() {
  // This would typically clear IndexedDB pending sync data
  console.log("Service Worker: Cleared pending sync data")
}

// Message handling from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

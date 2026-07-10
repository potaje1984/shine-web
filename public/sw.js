/// <reference lib="webworker" />

const CACHE_NAME = "shine-v3";

// Assets to pre-cache when the SW installs
const PRECACHE_URLS = ["/", "/login", "/manifest.json", "/shine-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Delete ALL old caches to prevent stale JS from being served
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => {
      // Also clear the current cache so fresh assets are fetched
      return caches.delete(CACHE_NAME);
    })
  );
  // Take control of all clients immediately
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// NETWORK-FIRST for everything — never serve stale cached JS/CSS/HTML
// This ensures users always get the latest deployed code
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Network-first for ALL same-origin requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline support
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Only fall back to cache if offline
        return caches.match(request);
      })
  );
});

// Handle notification clicks (for push notifications in the future)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow("/dashboard");
    })
  );
});

export {};
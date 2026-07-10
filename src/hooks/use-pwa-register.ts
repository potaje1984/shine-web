"use client";

/**
 * usePwaRegister.ts
 * Registers the service worker on mount to enable PWA installability.
 * Forces a page reload when a new service worker is detected to ensure
 * users always get the latest deployed code (not stale cached versions).
 */

import { useEffect } from "react";

export function usePwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // First, unregister any existing service worker to bust stale cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      Promise.all(
        registrations.map((reg) => {
          console.log("[PWA] Unregistering stale Service Worker:", reg.scope);
          return reg.unregister();
        })
      ).then(() => {
        // After clearing old workers, register fresh
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered:", reg.scope);

            // If the SW is already controlling the page, check for updates
            if (navigator.serviceWorker.controller) {
              reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (newWorker) {
                  newWorker.addEventListener("statechange", () => {
                    if (
                      newWorker.state === "activated" &&
                      navigator.serviceWorker.controller !== newWorker
                    ) {
                      console.log("[PWA] New SW activated, reloading page...");
                      window.location.reload();
                    }
                  });
                }
              });

              // Also check for updates immediately
              reg.update().catch(() => {});
            }

            // Wait for the new SW to claim this client, then reload
            // to ensure fresh assets are loaded
            if (!navigator.serviceWorker.controller) {
              navigator.serviceWorker.addEventListener("controllerchange", () => {
                console.log("[PWA] New controller claimed, reloading...");
                window.location.reload();
              });
            }
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    });
  }, []);
}
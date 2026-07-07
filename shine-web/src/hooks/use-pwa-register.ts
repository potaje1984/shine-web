"use client";

/**
 * usePwaRegister.ts
 * Registers the service worker on mount to enable PWA installability.
 * IMPORTANT: First unregisters any existing SW to force a fresh cache.
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
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    });
  }, []);
}
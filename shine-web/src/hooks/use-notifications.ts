"use client";

/**
 * useNotifications.ts
 * Real-time notification hook using Firestore onSnapshot.
 * Plays audio sound and shows browser push notification on new alerts.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { NotificationDoc } from "@/lib/types";

// Preload audio element
let audioEl: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio("/notification.wav");
    audioEl.volume = 0.6;
  }
  return audioEl;
}

function playNotificationSound() {
  try {
    const audio = getAudioElement();
    // Reset to beginning if already playing
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay blocked — silent fail
    });
  } catch {
    // Audio not supported
  }
}

function showBrowserNotification(notification: NotificationDoc) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: "/shine-logo.png",
      badge: "/shine-logo.png",
      tag: notification.id,
      requireInteraction: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notif.close(), 5000);

    // Navigate to orders page when clicked
    notif.onclick = () => {
      window.focus();
      notif.close();
      if (notification.orderId) {
        window.location.href = "/dashboard/orders";
      }
    };
  } catch {
    // Notification API not available
  }
}

/** Request browser notification permission. Returns the granted status. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const prevCountRef = useRef(0);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !profile?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function subscribe() {
      await initFirebase();
      const db = getFirestoreInstance();
      if (!db || cancelled) return;

      const q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const docs = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as NotificationDoc))
            .filter((n) => n.userId === profile.uid || (isAdmin && n.forAdmin));

          // Detect NEW notifications (not in previous set)
          const currentIds = new Set(docs.map((n) => n.id));
          const newIds = [...currentIds].filter((id) => !prevIdsRef.current.has(id));

          if (newIds.length > 0 && prevIdsRef.current.size > 0) {
            // Only trigger sound/push after initial load
            newIds.forEach((id) => {
              const notif = docs.find((n) => n.id === id);
              if (notif && !notif.read) {
                playNotificationSound();
                showBrowserNotification(notif);
              }
            });
          }

          prevIdsRef.current = currentIds;
          setNotifications(docs);
          setLoading(false);
        },
        (err) => {
          console.warn("[useNotifications] Snapshot error:", err);
          if (!cancelled) setLoading(false);
        }
      );

      unsubRef.current = unsub;
    }

    subscribe();

    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, [user?.uid, profile?.uid, isAdmin]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    const db = getFirestoreInstance();
    if (!db) return;
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (e) {
      console.warn("[useNotifications] markAsRead error:", e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const db = getFirestoreInstance();
    if (!db) return;
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter((n) => !n.read);
      unread.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      if (unread.length > 0) await batch.commit();
    } catch (e) {
      console.warn("[useNotifications] markAllAsRead error:", e);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
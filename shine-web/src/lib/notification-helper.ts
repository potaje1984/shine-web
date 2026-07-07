/**
 * notification-helper.ts
 * Helper to create notification documents in Firestore.
 * Called when order status changes or payment events occur.
 */

import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { OrderStatus, OrderPaymentStatus } from "@/lib/types";

/**
 * Generates notification content based on order status change.
 * Uses the status key to produce title/body in the caller's language context.
 */
export function getOrderStatusMessage(
  status: OrderStatus
): { titleKey: string; bodyKey: string } {
  const messages: Record<OrderStatus, { titleKey: string; bodyKey: string }> = {
    pending: {
      titleKey: "notifications.orderCreated.title",
      bodyKey: "notifications.orderCreated.body",
    },
    picked_up: {
      titleKey: "notifications.orderPickedUp.title",
      bodyKey: "notifications.orderPickedUp.body",
    },
    in_wash: {
      titleKey: "notifications.orderWashing.title",
      bodyKey: "notifications.orderWashing.body",
    },
    ready: {
      titleKey: "notifications.orderReady.title",
      bodyKey: "notifications.orderReady.body",
    },
    delivered: {
      titleKey: "notifications.orderDelivered.title",
      bodyKey: "notifications.orderDelivered.body",
    },
    cancelled: {
      titleKey: "notifications.orderCancelled.title",
      bodyKey: "notifications.orderCancelled.body",
    },
  };
  return messages[status];
}

export function getPaymentMessage(
  paymentStatus: OrderPaymentStatus
): { titleKey: string; bodyKey: string } | null {
  const messages: Partial<Record<OrderPaymentStatus, { titleKey: string; bodyKey: string }>> = {
    paid: {
      titleKey: "notifications.paymentSuccess.title",
      bodyKey: "notifications.paymentSuccess.body",
    },
    paid_cash: {
      titleKey: "notifications.paymentCash.title",
      bodyKey: "notifications.paymentCash.body",
    },
    failed: {
      titleKey: "notifications.paymentFailed.title",
      bodyKey: "notifications.paymentFailed.body",
    },
  };
  return messages[paymentStatus] || null;
}

/**
 * Create a notification document in Firestore.
 * Call from client-side after order status changes.
 */
export async function createNotification(params: {
  userId: string;
  type: "order_status" | "payment" | "system";
  title: string;
  body: string;
  orderId?: string;
  forAdmin?: boolean;
}): Promise<void> {
  await initFirebase();
  const db = getFirestoreInstance();
  if (!db) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      read: false,
      orderId: params.orderId || null,
      forAdmin: params.forAdmin || false,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[createNotification] Failed:", e);
  }
}
"use client";

/**
 * useOrders.ts
 * Hook para gestionar la colección de pedidos.
 * Expone la lista, loading, helpers de filtrado y mutaciones.
 */

import { useMemo, useCallback } from "react";
import { useCollection, orderBy, where } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import type { OrderDoc, OrderStatus, OrderFilters, ServiceType, OrderItem, Address } from "@/lib/types";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_CONFIG, SERVICE_TYPE_CONFIG, getInitialStatus } from "@/lib/constants";
import { createNotification } from "@/lib/notification-helper";

export function useOrders(filters?: OrderFilters) {
  const { profile, isAdmin, user } = useAuth();

  // For customers: filter at Firestore query level so other users' orders NEVER arrive
  // For admins: fetch all orders
  const customerWhere = !isAdmin && profile?.uid
    ? [where("userId", "==", profile.uid)]
    : [];

  // Traer pedidos ordenados por fecha (server-side filtered for customers)
  const { data, loading, error } = useCollection<OrderDoc>(
    "orders",
    ...customerWhere,
    orderBy("createdAt", "desc")
  );

  // Keep loading true until profile is ready (prevents flash of all orders)
  const isReady = isAdmin || !!profile?.uid;
  const effectiveLoading = loading || !isReady;

  // Filtrar: admin ve todo, customer solo los suyos (double safety)
  const filteredOrders = useMemo(() => {
    let result = data;

    // Filtro por usuario (customer solo ve sus pedidos)
    if (!isAdmin && profile?.uid) {
      result = result.filter((o) => o.userId === profile.uid);
    }

    // Filtro por usuario explícito (admin puede filtrar por customer)
    if (filters?.userId) {
      result = result.filter((o) => o.userId === filters.userId);
    }

    // Filtro por status
    if (filters?.status) {
      result = result.filter((o) => o.status === filters.status);
    }

    return result;
  }, [data, isAdmin, profile?.uid, filters?.userId, filters?.status]);

  // Estadísticas derivadas
  const stats = useMemo(() => {
    const orders = filteredOrders;
    return {
      total: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      byStatus: orders.reduce<Partial<Record<OrderStatus, number>>>(
        (acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        },
        {}
      ),
    };
  }, [filteredOrders]);

  /**
   * Returns the allowed next statuses for a given order status.
   */
  function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Updates the status of an existing order in Firestore.
   * Validates the transition before updating.
   */
  async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();

    if (!dbInstance) {
      throw new Error("Firestore not available.");
    }

    // Find current order to validate transition
    const currentOrder = data.find((o) => o.id === orderId);
    if (!currentOrder) {
      throw new Error("Order not found.");
    }

    const allowed = getNextStatuses(currentOrder.status);
    if (!allowed.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentOrder.status} to ${newStatus}`);
    }

    const orderRef = doc(dbInstance, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      // Set delivery date when delivered
      ...(newStatus === "delivered" ? { deliveryDate: new Date().toISOString() } : {}),
    });

    // Create notification for the customer
    const statusLabel = ORDER_STATUS_CONFIG[newStatus]?.label || newStatus;
    const serviceLabel = SERVICE_TYPE_CONFIG[currentOrder.serviceType]?.label || currentOrder.serviceType;
    await createNotification({
      userId: currentOrder.userId,
      type: "order_status",
      title: `Pedido actualizado: ${statusLabel}`,
      body: `Tu pedido de ${serviceLabel} ahora está: ${statusLabel}.`,
      orderId,
    });
  }

  /**
   * Customer accepts a cleaning quote.
   * Sets quoteAccepted = true and transitions status to "accepted".
   */
  async function acceptCleaningQuote(orderId: string): Promise<void> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    if (!dbInstance) throw new Error("Firestore not available.");
    const currentOrder = data.find((o) => o.id === orderId);
    if (!currentOrder) throw new Error("Order not found.");
    if (currentOrder.status !== "quoted") throw new Error("Order is not in quoted status.");
    await updateDoc(doc(dbInstance, "orders", orderId), {
      quoteAccepted: true,
      status: "accepted",
      updatedAt: new Date().toISOString(),
    });
    // If card payment, auto-charge the quoted amount
    if (currentOrder.paymentMethod === "card" && currentOrder.stripePaymentMethodId && currentOrder.quotedPrice) {
      try {
        const amount = Math.round(currentOrder.quotedPrice * 100);
        const res = await fetch("/api/stripe/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            stripeCustomerId: currentOrder.stripeCustomerId || null,
            stripePaymentMethodId: currentOrder.stripePaymentMethodId,
            amount,
          }),
        });
        const chargeData = await res.json();
        if (!res.ok) {
          await updateDoc(doc(dbInstance, "orders", orderId), { paymentStatus: "failed", updatedAt: new Date().toISOString() });
          throw new Error(chargeData.error || "Charge failed");
        }
        const updateData: Record<string, unknown> = { paymentStatus: "paid", stripePaymentIntentId: chargeData.paymentIntentId, updatedAt: new Date().toISOString() };
        if (chargeData.customerId && !currentOrder.stripeCustomerId) updateData.stripeCustomerId = chargeData.customerId;
        await updateDoc(doc(dbInstance, "orders", orderId), updateData);
      } catch (chargeError: any) {
        // Re-throw so the caller can handle it
        throw new Error(chargeError.message || "Charge failed after acceptance");
      }
    } else if (currentOrder.paymentMethod === "cash") {
      await updateDoc(doc(dbInstance, "orders", orderId), { paymentStatus: "pending", updatedAt: new Date().toISOString() });
    }
    await createNotification({
      userId: currentOrder.userId,
      type: "order_status",
      title: "Cotización aceptada",
      body: `Has aceptado la cotización de $${currentOrder.quotedPrice?.toFixed(2)} para tu servicio de limpieza. El equipo se pondrá en contacto contigo.`,
      orderId,
    });
  }

  /**
   * Customer rejects a cleaning quote (cancels the order).
   */
  async function rejectCleaningQuote(orderId: string): Promise<void> {
    await updateOrderStatus(orderId, "cancelled");
  }

  return {
    orders: filteredOrders,
    loading: effectiveLoading,
    error,
    stats,
    addOrder,
    addCleaningOrder,
    updateOrderStatus,
    setCleaningQuote,
    chargeCleaningOrder,
    acceptCleaningQuote,
    rejectCleaningQuote,
    getNextStatuses,
  };

  /**
   * Crea un nuevo pedido en Firestore.
   * Modelo por libras: calcula total = weight * pricePerPound.
   */
  async function addOrder(params: {
    serviceType: ServiceType;
    weight: number;
    pickupDate: string;
    pickupTime: string;
    address: Address;
    paymentMethod?: string;
    notes?: string;
    stripePaymentMethodId?: string;
    stripeSetupIntentId?: string;
    stripeCustomerId?: string;
  }): Promise<string> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    const currentUid = user?.uid;

    if (!dbInstance || !currentUid) {
      throw new Error("No active session or Firestore not available.");
    }

    // Obtener precio por libra según el servicio
    const { SERVICE_TYPE_CONFIG } = await import("@/lib/constants");
    const serviceCfg = SERVICE_TYPE_CONFIG[params.serviceType];
    const pricePerPound = serviceCfg?.pricePerPound ?? 1.5;
    const total = params.weight * pricePerPound;

    // Items para compatibilidad con OrderDoc (un solo item representando el servicio)
    const items: OrderItem[] = [
      {
        name: serviceCfg?.label || params.serviceType,
        quantity: params.weight,
        unitPrice: pricePerPound,
      },
    ];

    const docRef = await addDoc(collection(dbInstance, "orders"), {
      userId: currentUid,
      serviceType: params.serviceType,
      status: getInitialStatus(params.serviceType),
      items,
      weight: params.weight,
      confirmedWeight: null,
      pricePerPound,
      total,
      confirmedTotal: null,
      currency: "USD",
      pickupDate: params.pickupDate || null,
      pickupTime: params.pickupTime || null,
      deliveryDate: null,
      address: params.address,
      notes: params.notes || null,
      // Payment
      paymentMethod: (params.paymentMethod || "cash") as "cash" | "card",
      paymentStatus: params.paymentMethod === "card" ? "card_saved" as const : "pending" as const,
      stripeCustomerId: params.stripeCustomerId || null,
      stripePaymentMethodId: params.stripePaymentMethodId || null,
      stripeSetupIntentId: params.stripeSetupIntentId || null,
      stripePaymentIntentId: null,
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify admin about new order
    const sLabel = SERVICE_TYPE_CONFIG[params.serviceType]?.label || params.serviceType;
    createNotification({
      userId: currentUid,
      type: "order_status",
      title: "Nuevo pedido recibido",
      body: `${sLabel} - ${params.weight} lbs - $${total.toFixed(2)}. Recolección: ${params.pickupDate} ${params.pickupTime}`,
      orderId: docRef.id,
      forAdmin: true,
    }).catch(() => {});

    return docRef.id;
  }

  /**
   * Crea un nuevo pedido de limpieza de casa.
   */
  async function addCleaningOrder(params: {
    cleaningType: string;
    cleaningDescription: string;
    pickupDate: string;
    pickupTime: string;
    address: Address;
    paymentMethod?: string;
    notes?: string;
    stripePaymentMethodId?: string;
    stripeSetupIntentId?: string;
    stripeCustomerId?: string;
  }): Promise<string> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    const currentUid = user?.uid;
    if (!dbInstance || !currentUid) throw new Error("No active session or Firestore not available.");

    const { SERVICE_TYPE_CONFIG, CLEANING_TYPES } = await import("@/lib/constants");
    const cleanCfg = CLEANING_TYPES[params.cleaningType];
    const items: OrderItem[] = [{ name: cleanCfg?.label || params.cleaningType, quantity: 1, unitPrice: 0 }];

    const docRef = await addDoc(collection(dbInstance, "orders"), {
      userId: currentUid,
      serviceType: "house_cleaning" as ServiceType,
      status: getInitialStatus("house_cleaning"),
      items,
      weight: 0, confirmedWeight: null, pricePerPound: 0, total: 0, confirmedTotal: null,
      currency: "USD",
      pickupDate: params.pickupDate || null, pickupTime: params.pickupTime || null,
      deliveryDate: null, address: params.address, notes: params.notes || null,
      cleaningType: params.cleaningType, cleaningDescription: params.cleaningDescription,
      quotedPrice: null, quoteAccepted: null,
      paymentMethod: (params.paymentMethod || "cash") as "cash" | "card",
      paymentStatus: params.paymentMethod === "card" ? "card_saved" as const : "pending" as const,
      stripeCustomerId: params.stripeCustomerId || null,
      stripePaymentMethodId: params.stripePaymentMethodId || null,
      stripeSetupIntentId: params.stripeSetupIntentId || null,
      stripePaymentIntentId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });

    createNotification({
      userId: currentUid, type: "order_status",
      title: "Nueva solicitud de limpieza",
      body: `${cleanCfg?.label || params.cleaningType} - Visita: ${params.pickupDate} ${params.pickupTime}`,
      orderId: docRef.id, forAdmin: true,
    }).catch(() => {});

    return docRef.id;
  }

  async function setCleaningQuote(orderId: string, quotedPrice: number): Promise<void> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    if (!dbInstance) throw new Error("Firestore not available.");
    const orderRef = doc(dbInstance, "orders", orderId);
    await updateDoc(orderRef, { quotedPrice, total: quotedPrice, status: "quoted", updatedAt: new Date().toISOString() });
    const currentOrder = data.find((o) => o.id === orderId);
    if (currentOrder) {
      await createNotification({
        userId: currentOrder.userId, type: "order_status",
        title: "Cotización recibida",
        body: `Tu solicitud de limpieza tiene una cotización de $${quotedPrice.toFixed(2)}. Revisa tu pedido para aceptarla.`,
        orderId,
      });
    }
  }

  async function chargeCleaningOrder(orderId: string): Promise<void> {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    if (!dbInstance) throw new Error("Firestore not available.");
    const order = data.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found.");
    if (!order.quotedPrice || order.quotedPrice <= 0) throw new Error("No quoted price set.");
    const amount = Math.round(order.quotedPrice * 100);
    if (order.paymentMethod === "card" && order.stripePaymentMethodId) {
      const res = await fetch("/api/stripe/charge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, stripeCustomerId: order.stripeCustomerId || null, stripePaymentMethodId: order.stripePaymentMethodId, amount }),
      });
      const chargeData = await res.json();
      if (!res.ok) {
        await updateDoc(doc(dbInstance, "orders", orderId), { paymentStatus: "failed", updatedAt: new Date().toISOString() });
        throw new Error(chargeData.error || "Charge failed");
      }
      const updateData: Record<string, unknown> = { paymentStatus: "paid", stripePaymentIntentId: chargeData.paymentIntentId, updatedAt: new Date().toISOString() };
      if (chargeData.customerId && !order.stripeCustomerId) updateData.stripeCustomerId = chargeData.customerId;
      await updateDoc(doc(dbInstance, "orders", orderId), updateData);
    } else {
      await updateDoc(doc(dbInstance, "orders", orderId), { paymentStatus: "paid_cash", updatedAt: new Date().toISOString() });
    }
  }
}
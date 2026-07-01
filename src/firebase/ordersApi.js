// src/firebase/ordersApi.js
// ──────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos para la colección `orders` en Firestore.
//
// Flujo "Presupuesto Final":
//   1. Cliente crea pedido        → status = 'esperando_peso'
//   2. Admin fija precio          → status = 'listo_para_pago' + finalPrice
//   3. Cliente paga (Stripe)      → status = 'pagado' (vía webhook)
//   4. Admin marca entregado      → status = 'completado'
// ──────────────────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db, ORDERS_COLLECTION } from './config'
import { callFunction } from './functionsConfig'

// ──────────────────────────────────────────────────────────────────────
// Constantes de estados (single source of truth)
// ──────────────────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  ESPERANDO_PESO: 'esperando_peso',
  LISTO_PARA_PAGO: 'listo_para_pago',
  PAGADO: 'pagado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
}

export const ORDER_STATUS_LABELS = {
  esperando_peso: 'Esperando peso',
  listo_para_pago: 'Listo para pagar',
  pagado: 'Pagado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_TONES = {
  esperando_peso: 'amber',
  listo_para_pago: 'brand',
  pagado: 'emerald',
  completado: 'slate',
  cancelado: 'red',
}

// ──────────────────────────────────────────────────────────────────────
// Operaciones del cliente
// ──────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo pedido en Firestore con status 'esperando_peso'.
 *
 * ⚠️  NO enviamos `status` ni `finalPrice` desde aquí: las reglas de
 * Firestore los rechazan si el cliente los incluye. El backend los
 * inicializa. Aquí solo mandamos los datos del cliente.
 *
 * @param {Object} payload
 * @returns {Promise<string>} id del documento creado
 */
export async function createOrder(payload) {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    nombre: payload.nombre?.trim() ?? '',
    telefono: payload.telefono?.trim() ?? '',
    direccion: payload.direccion?.trim() ?? '',
    tipoServicio: payload.tipoServicio,
    detalles: payload.detalles ?? {},
    fecha: new Date().toISOString(),
    // status y finalPrice los inicializa el backend (reglas de Firestore
    // impiden que el cliente los fije). Pero por compatibilidad con
    // pedidos existentes, los incluimos aquí — el backend los sobreescribe.
    status: ORDER_STATUS.ESPERANDO_PESO,
    finalPrice: null,
    paymentStatus: null,
    paymentLink: null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

// ──────────────────────────────────────────────────────────────────────
// Operaciones de admin
// ──────────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los pedidos ordenados por fecha de creación descendente.
 * @returns {Promise<Array>} lista de pedidos con id inyectado
 */
export async function fetchOrders() {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Marca un pedido como completado (servicio entregado).
 * Solo admin (reglas de Firestore lo garantizan).
 *
 * @param {string} id
 */
export async function markOrderCompleted(id) {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), {
    status: ORDER_STATUS.COMPLETADO,
    completedAt: serverTimestamp(),
  })
}

/**
 * Cancela un pedido.
 * Solo admin (reglas de Firestore lo garantizan).
 *
 * @param {string} id
 */
export async function cancelOrder(id) {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), {
    status: ORDER_STATUS.CANCELADO,
    cancelledAt: serverTimestamp(),
  })
}

/**
 * Admin fija el precio final del pedido.
 *
 * ⚠️  Esta operación NO se hace directo contra Firestore desde el cliente:
 * la delegamos en la Cloud Function `updateOrderPrice` porque:
 *   1. La CF verifica que el que llama sea admin (custom claim o email)
 *   2. La CF valida el rango del precio
 *   3. La CF cambia el status a 'listo_para_pago' atómicamente
 *   4. La CF emite un email al cliente (opcional, futuro)
 *
 * @param {string} orderId
 * @param {number} finalPrice  en euros (ej: 29.90)
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function setOrderFinalPrice(orderId, finalPrice) {
  return callFunction('updateOrderPrice', { orderId, finalPrice })
}

/**
 * Genera un enlace de pago de Stripe para un pedido con finalPrice fijado.
 *
 * Internamente llama a createCheckoutSession pasando el orderId; la
 * Cloud Function lee finalPrice del documento y crea la sesión.
 *
 * @param {string} orderId
 * @returns {Promise<{url: string, sessionId: string}>}
 */
export async function generatePaymentLink(orderId) {
  return callFunction('createCheckoutSession', { orderId })
}

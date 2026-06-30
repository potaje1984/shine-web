// src/firebase/ordersApi.js
// ──────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos para la colección `orders` en Firestore.
// Centraliza todas las operaciones CRUD para que los componentes
// consuman una API limpia y desacoplada.
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

/**
 * Crea un nuevo pedido en Firestore.
 *
 * Estructura del documento:
 *  - nombre: string
 *  - telefono: string
 *  - direccion: string
 *  - tipoServicio: 'Lavandería' | 'Limpieza'
 *  - detalles: object (campos dinámicos según el tipo de servicio)
 *  - fecha: string ISO (legible)
 *  - estado: 'Pendiente' | 'Completado'  (por defecto 'Pendiente')
 *  - createdAt: timestamp del servidor
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
    estado: 'Pendiente',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

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
 * Cambia el estado de un pedido.
 * @param {string} id
 * @param {'Pendiente' | 'Completado'} nuevoEstado
 */
export async function updateOrderStatus(id, nuevoEstado) {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), { estado: nuevoEstado })
}

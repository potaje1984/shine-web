// src/firebase/paymentsApi.js
// ──────────────────────────────────────────────────────────────────────────
// Capa de acceso para el flujo de tarjetas guardadas (SetupIntent +
// PaymentIntent off-session).
//
// Flujo:
//   1. createSetupIntent() → devuelve clientSecret para Stripe Elements
//   2. confirmSetup() en el frontend → devuelve paymentMethodId
//   3. savePaymentMethod(paymentMethodId) → persiste en Firestore
//   4. listPaymentMethods() → lista tarjetas del usuario
//   5. chargeSavedCard(orderId) → cobra off-session (admin)
//
// ⚠️  NUNCA guardamos números de tarjeta en Firestore. Solo los IDs
//     y metadatos públicos (brand, last4) que devuelve Stripe.
// ──────────────────────────────────────────────────────────────────────────

import { callFunction } from './functionsConfig'

/**
 * FASE 1 — Iniciar el registro de una tarjeta.
 *
 * Llama a la Cloud Function `createSetupIntent` que devuelve un
 * `clientSecret` para inicializar Stripe Elements en el frontend.
 *
 * @returns {Promise<{clientSecret: string, setupIntentId: string, customerId: string}>}
 */
export async function createSetupIntent() {
  return callFunction('createSetupIntent')
}

/**
 * FASE 1 — Persistir la tarjeta recién registrada.
 *
 * Tras confirmar el SetupIntent con `stripe.confirmSetup()`, el frontend
 * recibe un `paymentMethodId`. Esta función lo envía al backend para:
 *   1. Adjuntarlo al Customer en Stripe
 *   2. Guardar sus metadatos (brand, last4) en Firestore users/{uid}
 *
 * @param {string} paymentMethodId  formato "pm_XXX"
 * @returns {Promise<{ok: boolean, paymentMethod: Object, isDefault: boolean}>}
 */
export async function savePaymentMethod(paymentMethodId) {
  return callFunction('savePaymentMethod', { paymentMethodId })
}

/**
 * Listar las tarjetas guardadas del usuario actual.
 *
 * @returns {Promise<{paymentMethods: Array, defaultPaymentMethodId: string|null}>}
 */
export async function listPaymentMethods() {
  return callFunction('listPaymentMethods')
}

/**
 * Marcar una tarjeta como por defecto.
 * @param {string} paymentMethodId
 */
export async function setDefaultPaymentMethod(paymentMethodId) {
  return callFunction('setDefaultPaymentMethod', { paymentMethodId })
}

/**
 * Eliminar una tarjeta guardada (detach en Stripe).
 * @param {string} paymentMethodId
 */
export async function removePaymentMethod(paymentMethodId) {
  return callFunction('removePaymentMethod', { paymentMethodId })
}

/**
 * FASE 2 — Cobrar con la tarjeta guardada del cliente.
 *
 * Solo admin puede invocarla. La CF cobra off-session (cliente no
 * presente) usando la tarjeta por defecto del cliente asociado al pedido.
 *
 * Si el banco requiere 3DS, devuelve `requiresAction: true` con un
 * `clientSecret` para que el frontend muestre el modal 3DS con
 * `stripe.handleCardAction()`.
 *
 * @param {string} orderId
 * @param {string} [paymentMethodId]  opcional, override la default
 * @returns {Promise<{ok: boolean, requiresAction: boolean, status: string, clientSecret?: string}>}
 */
export async function chargeSavedCard(orderId, paymentMethodId) {
  return callFunction('chargeSavedCard', { orderId, paymentMethodId })
}

/**
 * Tras completar el 3DS en el frontend, confirma el PaymentIntent
 * en el backend y marca el pedido como pagado.
 *
 * @param {string} paymentIntentId
 * @param {string} orderId
 */
export async function confirmCardAction(paymentIntentId, orderId) {
  return callFunction('confirmCardAction', { paymentIntentId, orderId })
}

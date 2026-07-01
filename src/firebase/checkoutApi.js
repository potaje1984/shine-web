// src/firebase/checkoutApi.js
// ──────────────────────────────────────────────────────────────────────────
// Capa de acceso para crear sesiones de checkout de Stripe.
//
// Usa callFunction() de functionsConfig.js, que detecta automáticamente
// el entorno (dev → emulador localhost:5001, prod → URL de Cloud Functions).
//
// En producción, la URL se construye a partir de VITE_FIREBASE_PROJECT_ID
// y VITE_FIREBASE_FUNCTIONS_REGION (por defecto us-central1).
// ──────────────────────────────────────────────────────────────────────────

import { callFunction } from './functionsConfig'

/**
 * Crea una sesión de Stripe Checkout y devuelve la URL a la que
 * redirigir al cliente para que pague.
 *
 * @param {Object} params
 * @param {string} params.orderId        id del pedido en Firestore
 * @param {number} params.amount         importe en céntimos (ej: 2990 = 29.90€)
 * @param {string} params.currency       código ISO (ej: 'eur', 'usd')
 * @param {string} [params.description]  descripción del cargo
 * @param {string} [params.customerEmail]  email del cliente (opcional)
 * @returns {Promise<{url: string, sessionId: string}>}
 */
export async function createCheckoutSession(params) {
  // Pasamos el origin actual para que la Cloud Function sepa a dónde
  // redirigir tras el pago (success_url / cancel_url).
  // En producción esto será tu dominio de Firebase Hosting.
  const origin = window.location.origin

  const result = await callFunction('createCheckoutSession', {
    ...params,
    origin,
  })

  if (!result?.url) {
    throw new Error('La Cloud Function no devolvió una URL de checkout.')
  }

  return result
}

/**
 * Redirige al cliente a la página de Stripe Checkout.
 *
 * Uso:
 *   const { url } = await startCheckout({ orderId, amount, currency })
 *   // → el navegador redirige automáticamente a Stripe
 */
export async function startCheckout(params) {
  const { url } = await createCheckoutSession(params)
  window.location.href = url
}

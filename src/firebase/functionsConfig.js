// src/firebase/functionsConfig.js
// ──────────────────────────────────────────────────────────────────────────
// Capa centralizada para invocar Cloud Functions desde el frontend.
//
// PROBLEMA QUE RESUELVE:
//   Antes, las URLs de Firebase Functions podían quedar "hardcodeadas"
//   a localhost, rompiendo el frontend en producción.
//
// SOLUCIÓN:
//   • En desarrollo → conecta al emulador local (localhost:5001) si la
//     variable VITE_USE_FUNCTIONS_EMULATOR === 'true'.
//   • En producción → usa automáticamente la URL de Cloud Functions
//     del proyecto Firebase configurado (config.js → getFunctions).
//   • El SDK de Firebase resuelve la URL solo: no hace falta hardcodear.
//
// CÓMO SE USA:
//   import { callFunction } from '../firebase/functionsConfig'
//   const result = await callFunction('setPaymentSecret', { provider, secretKey })
// ──────────────────────────────────────────────────────────────────────────

import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './config'

// Inicializa el cliente de Functions una sola vez.
export const functions = getFunctions(app)

// ──────────────────────────────────────────────────────────────────────
// Detección de entorno
// ──────────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV === true
const useEmulator =
  isDev && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true'

// URL base de producción — derivada del projectId de Firebase, no hardcodeada.
// Ej: https://us-central1-shine-web-8d20b.cloudfunctions.net
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1'
export const PRODUCTION_FUNCTIONS_BASE = `https://${region}-${projectId}.cloudfunctions.net`

// URL base actual según entorno
export const FUNCTIONS_BASE_URL = useEmulator
  ? 'http://localhost:5001'
  : PRODUCTION_FUNCTIONS_BASE

// Solo conectar al emulador si estamos en dev Y el flag está activado.
// Esto evita que el frontend llame a localhost en producción.
if (useEmulator) {
  // Import dinámico para no cargar el módulo del emulador en producción
  import('firebase/functions').then(({ connectFunctionsEmulator }) => {
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.info('[functions] Usando emulador local en localhost:5001')
  })
}

/**
 * Invoca una Cloud Function tipo Callable de forma segura y centralizada.
 *
 * Ventajas sobre usar httpsCallable directamente:
 *   1. Tipado implícito del nombre de la función.
 *   2. Manejo de errores uniforme (siempre lanzan Error con mensaje útil).
 *   3. Logs en desarrollo para depurar.
 *   4. Cambio automático dev/prod sin tocar el código de los componentes.
 *
 * @param {string} name  Nombre de la Cloud Function (ej: 'setPaymentSecret')
 * @param {object} [data]  Payload que se enviará a la función
 * @returns {Promise<any>}  Resultado de la función
 */
export async function callFunction(name, data = {}) {
  if (!name) throw new Error('callFunction: falta el nombre de la función')

  try {
    const callable = httpsCallable(functions, name)
    const result = await callable(data)

    if (isDev) {
      console.info(`[functions] ${name}() →`, result.data)
    }
    return result.data
  } catch (err) {
    // Firebase Functions SDK devuelve errores con .code y .message
    const code = err.code || 'unknown'
    const message = err.message || 'Error desconocido en la Cloud Function'

    if (isDev) {
      console.error(`[functions] ${name}() ERROR [${code}]:`, message, err)
    }

    // Re-lanzar con mensaje limpio para que el UI lo pueda mostrar
    const friendly = new Error(message)
    friendly.code = code
    friendly.originalError = err
    throw friendly
  }
}

/**
 * Construye la URL pública de una Cloud Function HTTP (no Callable).
 *
 * Útil para webhooks (Stripe), redirects, o fetch directo.
 *
 * @param {string} name  Nombre de la función (ej: 'stripeWebhook')
 * @returns {string}  URL completa
 */
export function getFunctionUrl(name) {
  if (useEmulator) {
    // El emulador incluye el projectId en la ruta
    return `http://localhost:5001/${projectId}/${region}/${name}`
  }
  return `${PRODUCTION_FUNCTIONS_BASE}/${name}`
}

// Información de entorno para debugging
export const env = {
  isDev,
  isProd: !isDev,
  useEmulator,
  functionsBaseUrl: FUNCTIONS_BASE_URL,
  productionFunctionsBase: PRODUCTION_FUNCTIONS_BASE,
}

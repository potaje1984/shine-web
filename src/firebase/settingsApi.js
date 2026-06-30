// src/firebase/settingsApi.js
// ──────────────────────────────────────────────────────────────────────────
// Acceso a la colección `settings` de Firestore.
//
// ⚠️  MODELO DE SEGURIDAD:
//   • Aquí SOLO se guardan campos PUBLICOS (publishableKey, provider, active).
//   • Las SECRET KEYS (sk_*, ACCESS_TOKEN) NUNCA van en Firestore.
//     Se gestionan mediante Cloud Functions env vars
//     (firebase functions:secrets:set STRIPE_SECRET_KEY).
//   • La Cloud Function `setPaymentSecret` permite al admin rotarlas
//     sin que el valor pase nunca por el navegador.
// ──────────────────────────────────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from './config'

const SETTINGS_DOC = 'payment-gateway' // id del documento dentro de /settings

/**
 * Devuelve la configuración pública de la pasarela de pago.
 * Devuelve null si no existe todavía.
 *
 * @typedef {Object} PaymentSettings
 * @property {string} provider         'stripe' | 'mercadopago'
 * @property {string} publishableKey   clave pública (pk_test_... o TEST-...)
 * @property {boolean} active          si la pasarela está activa
 * @property {string} updatedAt        ISO timestamp de última actualización
 * @property {string} updatedBy        email del admin que la actualizó
 *
 * @returns {Promise<PaymentSettings|null>}
 */
export async function getPaymentSettings() {
  const ref = doc(db, 'settings', SETTINGS_DOC)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/**
 * Guarda la configuración PÚBLICA de la pasarela.
 *
 * NO acepta secret keys: si las recibiera, las rechaza explícitamente
 * para evitar que se filtren por accidente en Firestore.
 *
 * @param {Object} params
 * @param {string} params.provider
 * @param {string} params.publishableKey
 * @param {boolean} params.active
 * @param {string} params.updatedBy  email del admin
 */
export async function savePaymentSettings({ provider, publishableKey, active, updatedBy }) {
  // Sanity check: nunca persistir secret keys aquí
  const value = String(publishableKey || '')
  if (/^(sk_|rk_|whsec_)/.test(value)) {
    throw new Error(
      'No se puede guardar una secret key en Firestore. Usa la Cloud Function setPaymentSecret.',
    )
  }
  if (/^(APP_USR_|ACCESS_TOKEN)/.test(value)) {
    throw new Error(
      'No se puede guardar el access token de Mercado Pago en Firestore. Usa setPaymentSecret.',
    )
  }

  const ref = doc(db, 'settings', SETTINGS_DOC)
  await setDoc(ref, {
    provider,
    publishableKey: publishableKey.trim(),
    active: !!active,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: true })
}

/**
 * Indica si la secret key ya fue configurada en Cloud Functions.
 * Se usa en el admin UI para mostrar "Configurado" vs "Pendiente".
 * NO devuelve el valor, solo un booleano.
 *
 * Implementación: lee el campo `secretKeySet` que la Cloud Function
 * `setPaymentSecret` escribe cuando guarda correctamente el secreto.
 */
export async function isSecretKeyConfigured() {
  const ref = doc(db, 'settings', SETTINGS_DOC)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  return Boolean(snap.data().secretKeySet)
}

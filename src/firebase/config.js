// src/firebase/config.js
// ──────────────────────────────────────────────────────────────────────────
// Configuración de Firebase.
//
// ⚠️  IMPORTANTE: NO pegues tus credenciales directamente aquí.
// Crea un archivo `.env` en la raíz del proyecto con estas variables
// (ver `.env.example`):
//
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_FIREBASE_PROJECT_ID=...
//   VITE_FIREBASE_STORAGE_BUCKET=...
//   VITE_FIREBASE_MESSAGING_SENDER_ID=...
//   VITE_FIREBASE_APP_ID=...
//   VITE_FIREBASE_FUNCTIONS_REGION=us-central1   (opcional, por defecto)
//   VITE_USE_FUNCTIONS_EMULATOR=true             (solo en dev con emulador)
//
// Vite expone automáticamente al cliente cualquier var con prefijo VITE_.
// ──────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inicialización singleton
export const app = initializeApp(firebaseConfig)

// Firestore — base de datos de pedidos
export const db = getFirestore(app)

// Auth — autenticación de usuarios (email + password)
//
// ⚠️  Activa el método Email/Password en:
//   Firebase Console → Authentication → Sign-in method → Email/Password → Enable
//
// Después crea tu usuario admin en:
//   Firebase Console → Authentication → Users → Add user
export const auth = getAuth(app)

// NOTA: Las Cloud Functions se inicializan en src/firebase/functionsConfig.js
// para centralizar la lógica de detección de entorno (dev vs prod) y evitar
// que el frontend llame a localhost en producción.

// Nombre de la colección central de pedidos
export const ORDERS_COLLECTION = 'orders'

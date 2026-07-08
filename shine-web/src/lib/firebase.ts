/**
 * firebase.ts
 * -----------------------------------------------------------
 * Inicialización lazy de Firebase para la app.
 *
 * Usa Firebase v12 Modular SDK. La config se inyecta al HTML
 * desde el servidor (layout.tsx) via window.__FIREBASE_CONFIG__.
 *
 * IMPORTANTE: La inicialización es LAZY (bajo demanda) para evitar
 * problemas de timing donde el módulo se evalúa antes de que
 * el <script> del layout inyecte window.__FIREBASE_CONFIG__.
 * -----------------------------------------------------------
 */

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Tipo para la config inyectada
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// ----------------------------------------------------------
// Singleton state (private)
// ----------------------------------------------------------
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _initialized = false;
let _initPromise: Promise<void> | null = null;
let _initError: string | null = null;

// ----------------------------------------------------------
// Obtener config desde window o process.env
// ----------------------------------------------------------
function getFirebaseConfig(): FirebaseConfig | null {
  // Cliente: priorizar window.__FIREBASE_CONFIG__
  if (typeof window !== "undefined") {
    const w = window as unknown as { __FIREBASE_CONFIG__?: FirebaseConfig };
    const fromWindow = w.__FIREBASE_CONFIG__;

    if (fromWindow && fromWindow.apiKey) {
      return fromWindow;
    }

    // Fallback: process.env (para Vercel / build local sin Codespaces)
    const fromEnv: FirebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    };

    if (fromEnv.apiKey) return fromEnv;
    return null;
  }

  // Servidor: leer de process.env
  const config: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  if (!config.apiKey) return null;
  return config;
}

// ----------------------------------------------------------
// Inicialización lazy
// ----------------------------------------------------------
function ensureInitialized(): void {
  // Ya inicializado — nada que hacer
  if (_initialized) return;

  const config = getFirebaseConfig();

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firebase] No se pudo obtener la configuración.",
        "En el cliente se usa window.__FIREBASE_CONFIG__ (inyectado por layout.tsx).",
        "Si ves este error, verifica que .env.local tiene las 6 variables NEXT_PUBLIC_FIREBASE_*"
      );
    }
    return;
  }

  try {
    _app = getApps().length ? getApp() : initializeApp(config);

    try {
      _db = initializeFirestore(_app, {
        experimentalForceLongPolling: true,
      });
    } catch {
      _db = getFirestore(_app);
    }

    _storage = getStorage(_app);
    _auth = getAuth(_app);
    // browserLocalPersistence solo funciona en el navegador
    if (typeof window !== "undefined") {
      setPersistence(_auth, browserLocalPersistence).catch((err) =>
        console.warn("[firebase] No se pudo setear persistencia:", err)
      );
    }

    _initialized = true;
  } catch (err: any) {
    _initError = err?.message || String(err);
    console.error("[firebase] Error al inicializar Firebase:", err);
  }
}

// ----------------------------------------------------------
// Función pública para inicialización async (para AuthGuard)
// Útil si quieres await explícito antes de renderizar
// ----------------------------------------------------------
export async function initFirebase(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) {
    await _initPromise;
    if (_initError) throw new Error(_initError);
    return;
  }
  _initPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      ensureInitialized();
      if (_initError) {
        resolve(); // resolve but error is stored
      } else {
        resolve();
      }
    }, 0);
  });
  return _initPromise;
}

// ----------------------------------------------------------
// Getters que inicializan bajo demanda
// ----------------------------------------------------------
export function getFirebaseApp(): FirebaseApp | null {
  if (!_initialized) ensureInitialized();
  return _app;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export function getAuthInstance(): Auth | null {
  if (!_initialized) ensureInitialized();
  return _auth;
}

export function getFirestoreInstance(): Firestore | null {
  if (!_initialized) ensureInitialized();
  return _db;
}

export function getStorageInstance(): FirebaseStorage | null {
  if (!_initialized) ensureInitialized();
  return _storage;
}

export function isFirebaseConfigured(): boolean {
  // Check config presence first (works even if SDK init failed)
  const config = getFirebaseConfig();
  if (!config) return false;
  // Then check if SDK actually initialized
  if (!_initialized) ensureInitialized();
  return _initialized;
}

/** Check if config values exist (without trying to init SDK) */
export function hasFirebaseConfig(): boolean {
  const config = getFirebaseConfig();
  return !!config;
}

/** Get the init error message if SDK failed to initialize */
export function getFirebaseInitError(): string | null {
  return _initError;
}

/**
 * Devuelve un mensaje legible si la config falta o es inválida.
 * null = todo bien.
 */
export function getFirebaseConfigError(): string | null {
  if (typeof window === "undefined") return null;
  const cfg = getFirebaseConfig();
  if (!cfg) return "Firebase is not configured. Check your environment variables.";
  if (!cfg.apiKey) return "Firebase API Key is empty. Check your environment variables.";
  if (!cfg.projectId) return "Firebase Project ID is empty. Check your environment variables.";
  if (!cfg.authDomain) return "Firebase Auth Domain is empty. Check your environment variables.";
  return null;
}

// ----------------------------------------------------------
// Exports compatibles con el código existente
// (alias para no romper los imports actuales)
// ----------------------------------------------------------
export const app = new Proxy({} as object, {
  get(_target, prop) {
    const instance = getFirebaseApp();
    if (!instance) return undefined;
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = getFirebaseApp();
    if (!instance) return undefined;
    return Object.getOwnPropertyDescriptor(instance, prop);
  },
});

export const auth = new Proxy({} as object, {
  get(_target, prop) {
    const instance = getAuthInstance();
    if (!instance) return undefined;
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = getAuthInstance();
    if (!instance) return undefined;
    return Object.getOwnPropertyDescriptor(instance, prop);
  },
});

export const db = new Proxy({} as object, {
  get(_target, prop) {
    const instance = getFirestoreInstance();
    if (!instance) return undefined;
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = getFirestoreInstance();
    if (!instance) return undefined;
    return Object.getOwnPropertyDescriptor(instance, prop);
  },
});

export const storage = new Proxy({} as object, {
  get(_target, prop) {
    const instance = getStorageInstance();
    if (!instance) return undefined;
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = getStorageInstance();
    if (!instance) return undefined;
    return Object.getOwnPropertyDescriptor(instance, prop);
  },
});

// isConfigured: lazy check — usa la función real en runtime
export { isFirebaseConfigured as isConfigured };
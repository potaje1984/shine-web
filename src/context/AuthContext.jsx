// src/context/AuthContext.jsx
// ──────────────────────────────────────────────────────────────────────────
// Contexto global de autenticación.
//
// Expone `user`, `loading`, `login()`, `logout()` y `signup()`.
// Se inicializa una sola vez en `main.jsx` envolviendo `<App />`.
// ──────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

/**
 * Hook de acceso al contexto. Lanza error si se usa fuera del provider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Suscripción a cambios de sesión de Firebase.
  // Se ejecuta una sola vez al montar el provider.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  /**
   * Inicia sesión con email + password.
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  /**
   * Crea un nuevo usuario y opcionalmente le asigna un displayName.
   * @param {string} email
   * @param {string} password
   * @param {string} [displayName]
   */
  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    return cred
  }

  /** Cierra la sesión actual. */
  function logout() {
    return signOut(auth)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    // Helpers útiles para componentes
    isAuthenticated: !!user,
    displayName: user?.displayName || user?.email || '',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

// src/pages/Login.jsx
// ──────────────────────────────────────────────────────────────────────────
// Página de inicio de sesión para administradores.
//
//  • Formulario email + password.
//  • Usa el método `login()` del AuthContext (signInWithEmailAndPassword).
//  • Tras login exitoso, redirige a la ruta guardada en location.state.from
//    o, por defecto, a /admin.
//  • Si el usuario ya está logueado y entra en /login, lo redirige a /admin.
// ──────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Si ya está logueado, fuera de /login.
  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  // Ruta destino tras login: la que guardó ProtectedRoute, o /admin.
  const destino = location.state?.from?.pathname || '/admin'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Introduce email y contraseña.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      // onAuthStateChanged disparará el redirect; aquí forzamos navegación
      // para sentirlo inmediato.
      navigate(destino, { replace: true })
    } catch (err) {
      console.error(err)
      setError(traducirErrorAuth(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-b from-brand-50/70 to-white py-12">
      <div className="w-full max-w-md px-4">
        {/* Logo / cabecera */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
              <SparkleIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold text-slate-900">
                Shine
              </span>
              <span className="text-[10px] uppercase tracking-widest text-brand-600">
                Admin
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Acceso al panel
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inicia sesión para gestionar los pedidos.
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="card p-6 sm:p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Correo electrónico
                <span className="text-red-500"> *</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="admin@shine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Contraseña
                <span className="text-red-500"> *</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-brand-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 animate-slide-up"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? (
                <>
                  <Spinner /> Entrando…
                </>
              ) : (
                <>
                  <LockIcon className="h-4 w-4" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Pie */}
          <p className="mt-5 text-center text-xs text-slate-400">
            ¿No tienes acceso? Solicita tus credenciales al administrador.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function traducirErrorAuth(code) {
  const map = {
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe ninguna cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/too-many-requests':
      'Demasiados intentos fallidos. Inténtalo más tarde.',
    'auth/network-request-failed':
      'Sin conexión con el servidor. Revisa tu internet.',
    'auth/configuration-not-found':
      'Email/Password no está habilitado en Firebase Console.',
  }
  return map[code] || 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SparkleIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </svg>
  )
}

function LockIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

// src/components/ProtectedRoute.jsx
// ──────────────────────────────────────────────────────────────────────────
// Envuelve rutas que requieren autenticación.
//
//  • Si Firebase Auth todavía está verificando la sesión → loading spinner.
//  • Si NO hay usuario logueado → redirige a /login (guardando la URL
//    destino en `state.from` para volver tras iniciar sesión).
//  • Si hay usuario logueado → renderiza el children.
//
// Uso:
//   <Route path="/admin" element={
//     <ProtectedRoute>
//       <Admin />
//     </ProtectedRoute>
//   } />
// ──────────────────────────────────────────────────────────────────────────

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Mientras Firebase resuelve la sesión, mostramos un loader para
  // evitar el parpadeo de redirección a /login.
  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-3 text-sm text-slate-500">
            Verificando sesión…
          </p>
        </div>
      </div>
    )
  }

  // Sin sesión → redirige a /login recordando la ruta destino.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Sesión válida → renderiza el contenido protegido.
  return children
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-brand-500 mx-auto h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="cargando"
    >
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

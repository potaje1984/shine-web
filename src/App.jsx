import { useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Login from './pages/Login'
import PaymentSettings from './pages/PaymentSettings'
import SaveCard from './pages/SaveCard'

/**
 * Layout raíz + rutas:
 *   '/'                          → Home
 *   '/login'                     → Login (email + password)
 *   '/save-card'                 → Registro de tarjeta (Stripe Elements)
 *   '/admin'                     → Panel de pedidos (protegido)
 *   '/admin/payment-settings'    → Configuración de pago (protegido)
 *   '/redirect?to=...'           → Ruta interna para reconstruir URLs
 *                                   profundas en GitHub Pages (ver 404.html)
 *   '*'                          → 404
 */
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // ──────────────────────────────────────────────────────────────────
  // GitHub Pages SPA trick:
  // Cuando alguien entra directamente a /admin/payment-settings, GitHub
  // sirve 404.html que redirige a /#/redirect?to=%2Fadmin%2Fpayment-settings
  // Aquí interceptamos esa ruta y la reconstruimos como ruta real.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (location.pathname === '/redirect') {
      const params = new URLSearchParams(location.search)
      const target = params.get('to') || '/'
      // Limpiar el hash y la query, navegar a la ruta real
      navigate(target, { replace: true })
    }
  }, [location, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/save-card"
            element={
              <ProtectedRoute>
                <SaveCard />
              </ProtectedRoute>
            }
          />
          <Route path="/redirect" element={<RedirectHandler />} />

          {/* Rutas protegidas — requieren usuario autenticado */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment-settings"
            element={
              <ProtectedRoute>
                <PaymentSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="container-page py-24 text-center">
                <p className="text-6xl mb-4">🧺</p>
                <h1 className="text-3xl font-bold text-slate-900">
                  Página no encontrada
                </h1>
                <p className="mt-2 text-slate-600">
                  La página que buscas no existe o fue movida.
                </p>
                <Link to="/" className="btn-primary mt-6 inline-flex">
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

/**
 * Componente placeholder mientras se procesa el redirect.
 * El useEffect del App ya hace navigate() antes de que se vea esto.
 */
function RedirectHandler() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-brand-500" />
        <p className="mt-3 text-sm text-slate-500">Cargando…</p>
      </div>
    </div>
  )
}

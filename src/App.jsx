import { Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Login from './pages/Login'

/**
 * Layout raíz + rutas:
 *   '/'      → Home (Hero + Servicios + Cómo funciona + Formulario)
 *   '/login' → Página de inicio de sesión (email + password)
 *   '/admin' → Panel de administración (protegido por ProtectedRoute)
 *   '*'      → 404
 */
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Ruta protegida — requiere usuario autenticado */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
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

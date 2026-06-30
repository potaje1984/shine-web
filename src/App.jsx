import { Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Admin from './pages/Admin'

/**
 * Layout raíz + rutas:
 *   '/'      → Home (Hero + Servicios + Cómo funciona + Formulario)
 *   '/admin' → Panel de administración
 *   '*'      → 404
 */
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
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

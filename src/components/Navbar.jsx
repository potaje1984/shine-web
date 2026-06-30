import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Barra de navegación superior — fija, con efecto blur al hacer scroll.
 * Muestra el logo de Shine, navegación principal y un CTA de pedido.
 * Si el usuario está logueado, muestra el correo y un botón de logout.
 */
export default function Navbar() {
  const { isAuthenticated, displayName, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const linkBase =
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-slate-100">
      <nav className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <SparkleIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-slate-900">
              Shine
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-600">
              Lavandería & Limpieza
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
            end
          >
            Inicio
          </NavLink>
          <a
            href="/#servicios"
            className={`${linkBase} text-slate-600 hover:bg-slate-100`}
          >
            Servicios
          </a>
          <a
            href="/#como-funciona"
            className={`${linkBase} text-slate-600 hover:bg-slate-100`}
          >
            Cómo funciona
          </a>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Admin
          </NavLink>
        </div>

        {/* CTA / Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  Conectado
                </span>
                <span
                  className="text-xs font-medium text-slate-700 max-w-[180px] truncate"
                  title={displayName}
                >
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn-ghost text-sm"
                title="Cerrar sesión"
              >
                {loggingOut ? '…' : 'Salir'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm hidden sm:inline-flex">
                Acceder
              </Link>
              <a href="/#pedido" className="btn-primary text-sm">
                <SparkleIcon className="h-4 w-4" />
                Pedir ahora
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
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

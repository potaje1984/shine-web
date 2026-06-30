import { NavLink, Link } from 'react-router-dom'

/**
 * Barra de navegación superior — fija, con efecto blur al hacer scroll.
 * Muestra el logo de Shine, navegación principal y un CTA de pedido.
 */
export default function Navbar() {
  const linkBase =
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors'

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

        {/* CTA */}
        <a href="/#pedido" className="btn-primary hidden sm:inline-flex">
          <SparkleIcon className="h-4 w-4" />
          Pedir ahora
        </a>
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

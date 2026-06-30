import AdminPanel from '../components/AdminPanel'
import AdminNav from '../components/AdminNav'
import { useAuth } from '../context/AuthContext'

/**
 * Página de administración (ruta '/admin').
 * Muestra el panel completo de gestión de pedidos.
 * Solo accesible si el usuario está autenticado (ProtectedRoute).
 */
export default function Admin() {
  const { displayName, logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return (
    <div className="container-page py-10">
      <AdminNav />

      <header className="mt-6 mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white">
              <DashboardIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Panel de administración
              </h1>
              <p className="text-sm text-slate-500">
                Gestiona todos los pedidos de Shine en tiempo real.
              </p>
            </div>
          </div>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Conectado
              </span>
              <span
                className="text-xs font-medium text-slate-700 max-w-[200px] truncate"
                title={displayName}
              >
                {displayName}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              <LogoutIcon className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <AdminPanel />
    </div>
  )
}

function DashboardIcon({ className = '' }) {
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
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function LogoutIcon({ className = '' }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

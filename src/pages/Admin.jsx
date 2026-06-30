import AdminPanel from '../components/AdminPanel'

/**
 * Página de administración (ruta '/admin').
 * Muestra el panel completo de gestión de pedidos.
 */
export default function Admin() {
  return (
    <div className="container-page py-10">
      <header className="mb-8">
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

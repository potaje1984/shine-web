import { useEffect, useMemo, useState } from 'react'
import {
  fetchOrders,
  updateOrderStatus,
} from '../firebase/ordersApi'

const FILTROS = [
  { key: 'todos', label: 'Todos', icon: '📋' },
  { key: 'Lavandería', label: 'Lavandería', icon: '👕' },
  { key: 'Limpieza', label: 'Limpieza', icon: '🧹' },
]

const ESTADOS = [
  { key: 'Pendiente', label: 'Pendiente' },
  { key: 'Completado', label: 'Completado' },
]

/**
 * Panel de administración:
 *  • Lista todos los pedidos en una tabla responsive.
 *  • Filtro por tipo de servicio (Todos / Lavandería / Limpieza).
 *  • Botón para cambiar estado entre Pendiente ⇄ Completado.
 */
export default function AdminPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [updatingId, setUpdatingId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchOrders()
      setOrders(data)
    } catch (err) {
      console.error(err)
      setError(
        'No se pudieron cargar los pedidos. Revisa la configuración de Firebase.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleEstado(order) {
    const nuevo = order.estado === 'Pendiente' ? 'Completado' : 'Pendiente'
    setUpdatingId(order.id)
    try {
      // Actualización optimista en UI
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, estado: nuevo } : o)),
      )
      await updateOrderStatus(order.id, nuevo)
    } catch (err) {
      console.error(err)
      // Revertir en caso de error
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, estado: order.estado } : o)),
      )
      alert('No se pudo actualizar el estado. Inténtalo de nuevo.')
    } finally {
      setUpdatingId(null)
    }
  }

  const pedidosFiltrados = useMemo(() => {
    if (filtro === 'todos') return orders
    return orders.filter((o) => o.tipoServicio === filtro)
  }, [orders, filtro])

  const stats = useMemo(
    () => ({
      total: orders.length,
      pendientes: orders.filter((o) => o.estado === 'Pendiente').length,
      completados: orders.filter((o) => o.estado === 'Completado').length,
      lavanderia: orders.filter((o) => o.tipoServicio === 'Lavandería').length,
      limpieza: orders.filter((o) => o.tipoServicio === 'Limpieza').length,
    }),
    [orders],
  )

  return (
    <div className="space-y-6">
      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} tone="slate" />
        <StatCard label="Pendientes" value={stats.pendientes} tone="amber" />
        <StatCard label="Completados" value={stats.completados} tone="emerald" />
        <StatCard label="Lavandería" value={stats.lavanderia} tone="brand" />
        <StatCard label="Limpieza" value={stats.limpieza} tone="accent" />
      </div>

      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const active = filtro === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span aria-hidden>{f.icon}</span>
                {f.label}
              </button>
            )
          })}
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshIcon className="h-4 w-4" />
          Refrescar
        </button>
      </div>

      {/* ---------- Tabla ---------- */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Spinner size={32} />
            <p className="mt-3 text-sm">Cargando pedidos…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-700 bg-red-50 border-b border-red-100">
            {error}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-600 font-medium">No hay pedidos.</p>
            <p className="text-sm text-slate-400">
              Cuando recibas tu primer pedido aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <Th>Cliente</Th>
                  <Th>Contacto</Th>
                  <Th>Servicio</Th>
                  <Th>Detalles</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acción</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFiltrados.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    {/* Cliente */}
                    <Td>
                      <div className="font-medium text-slate-800">
                        {order.nombre || '—'}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">
                        {order.direccion}
                      </div>
                    </Td>
                    {/* Contacto */}
                    <Td>
                      <a
                        href={`tel:${order.telefono}`}
                        className="text-brand-700 hover:underline"
                      >
                        {order.telefono || '—'}
                      </a>
                    </Td>
                    {/* Servicio */}
                    <Td>
                      <span
                        className={`badge ${
                          order.tipoServicio === 'Lavandería'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-accent-100 text-accent-800'
                        }`}
                      >
                        {order.tipoServicio}
                      </span>
                    </Td>
                    {/* Detalles */}
                    <Td>
                      <DetallesCell order={order} />
                    </Td>
                    {/* Fecha */}
                    <Td>
                      <FechaCell iso={order.fecha} />
                    </Td>
                    {/* Estado */}
                    <Td>
                      <span
                        className={
                          order.estado === 'Pendiente'
                            ? 'badge-pending'
                            : 'badge-completed'
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {order.estado}
                      </span>
                    </Td>
                    {/* Acción */}
                    <Td className="text-right">
                      <button
                        onClick={() => toggleEstado(order)}
                        disabled={updatingId === order.id}
                        className={`btn text-xs px-3 py-1.5 ${
                          order.estado === 'Pendiente'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-300'
                        }`}
                      >
                        {updatingId === order.id ? (
                          <Spinner size={14} />
                        ) : order.estado === 'Pendiente' ? (
                          '✓ Completar'
                        ) : (
                          '↺ Reabrir'
                        )}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>
  )
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
}

function DetallesCell({ order }) {
  const d = order.detalles || {}
  if (order.tipoServicio === 'Lavandería') {
    return (
      <div className="text-xs space-y-0.5">
        <div>
          <span className="text-slate-400">Prenda:</span>{' '}
          <span className="font-medium">{d.tipoPrenda || '—'}</span>
        </div>
        <div>
          <span className="text-slate-400">Peso:</span>{' '}
          <span className="font-medium">{d.pesoKg ? `${d.pesoKg} kg` : '—'}</span>
        </div>
        {d.notas && (
          <div className="text-slate-500 italic max-w-[200px] truncate">
            “{d.notas}”
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="text-xs space-y-0.5">
      <div>
        <span className="text-slate-400">Habitaciones:</span>{' '}
        <span className="font-medium">{d.numHabitaciones || '—'}</span>
      </div>
      <div>
        <span className="text-slate-400">Tipo:</span>{' '}
        <span className="font-medium">{d.tipoLimpieza || '—'}</span>
      </div>
      {d.notas && (
        <div className="text-slate-500 italic max-w-[200px] truncate">
          “{d.notas}”
        </div>
      )}
    </div>
  )
}

function FechaCell({ iso }) {
  if (!iso) return <span className="text-slate-400">—</span>
  try {
    const date = new Date(iso)
    return (
      <div className="text-xs">
        <div className="font-medium text-slate-700">
          {date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
        <div className="text-slate-400">
          {date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    )
  } catch {
    return <span className="text-slate-400">—</span>
  }
}

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
  }
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
    </div>
  )
}

function RefreshIcon({ className = '' }) {
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
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

function Spinner({ size = 24 }) {
  return (
    <svg
      className="animate-spin text-brand-500 mx-auto"
      style={{ width: size, height: size }}
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

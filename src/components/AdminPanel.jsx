// src/components/AdminPanel.jsx
// ──────────────────────────────────────────────────────────────────────────
// Panel de administración de pedidos — flujo "Presupuesto Final".
//
// Estados:
//   esperando_peso   → recién creado, admin debe pesar y fijar precio
//   listo_para_pago  → precio fijado, pendiente de generar link de pago
//   pagado           → cliente pagó (vía Stripe webhook)
//   completado       → servicio entregado
//   cancelado        → cancelado
//
// Filtros: Todos / Esperando peso / Listo para pagar / Pagados / Completados
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import {
  fetchOrders,
  markOrderCompleted,
  cancelOrder,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
} from '../firebase/ordersApi'
import OrderPricingCard from './OrderPricingCard'

const FILTROS = [
  { key: 'todos', label: 'Todos', icon: '📋' },
  { key: ORDER_STATUS.ESPERANDO_PESO, label: 'Esperando peso', icon: '⚖️' },
  { key: ORDER_STATUS.LISTO_PARA_PAGO, label: 'Listo para pagar', icon: '💳' },
  { key: ORDER_STATUS.PAGADO, label: 'Pagados', icon: '✅' },
  { key: ORDER_STATUS.COMPLETADO, label: 'Completados', icon: '🎯' },
]

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
      setError('No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleMarkCompleted(order) {
    setUpdatingId(order.id)
    try {
      await markOrderCompleted(order.id)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: ORDER_STATUS.COMPLETADO } : o,
        ),
      )
    } catch (err) {
      console.error(err)
      alert('No se pudo marcar como completado.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCancel(order) {
    if (!confirm('¿Cancelar este pedido?')) return
    setUpdatingId(order.id)
    try {
      await cancelOrder(order.id)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: ORDER_STATUS.CANCELADO } : o,
        ),
      )
    } catch (err) {
      console.error(err)
      alert('No se pudo cancelar el pedido.')
    } finally {
      setUpdatingId(null)
    }
  }

  const pedidosFiltrados = useMemo(() => {
    if (filtro === 'todos') return orders
    return orders.filter((o) => o.status === filtro)
  }, [orders, filtro])

  const stats = useMemo(
    () => ({
      total: orders.length,
      esperando: orders.filter((o) => o.status === ORDER_STATUS.ESPERANDO_PESO).length,
      listoPago: orders.filter((o) => o.status === ORDER_STATUS.LISTO_PARA_PAGO).length,
      pagado: orders.filter((o) => o.status === ORDER_STATUS.PAGADO).length,
      completado: orders.filter((o) => o.status === ORDER_STATUS.COMPLETADO).length,
    }),
    [orders],
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} tone="slate" />
        <StatCard label="Esperando peso" value={stats.esperando} tone="amber" />
        <StatCard label="Listo para pagar" value={stats.listoPago} tone="brand" />
        <StatCard label="Pagados" value={stats.pagado} tone="emerald" />
        <StatCard label="Completados" value={stats.completado} tone="slate" />
      </div>

      {/* Toolbar */}
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

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-slate-500">
            <Spinner />
            <p className="mt-3 text-sm">Cargando pedidos…</p>
          </div>
        ) : error ? (
          <div className="card p-6 text-sm text-red-700 bg-red-50 border-b border-red-100">
            {error}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-600 font-medium">No hay pedidos.</p>
            <p className="text-sm text-slate-400">
              {filtro === 'todos'
                ? 'Cuando recibas tu primer pedido aparecerá aquí.'
                : `No hay pedidos en estado "${ORDER_STATUS_LABELS[filtro] || filtro}".`}
            </p>
          </div>
        ) : (
          pedidosFiltrados.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              updatingId={updatingId}
              onMarkCompleted={handleMarkCompleted}
              onCancel={handleCancel}
              onUpdated={load}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Fila de pedido (tarjeta)
// ──────────────────────────────────────────────────────────────────────

function OrderRow({ order, updatingId, onMarkCompleted, onCancel, onUpdated }) {
  const tone = ORDER_STATUS_TONES[order.status] || 'slate'
  const showPricingCard =
    order.status === ORDER_STATUS.ESPERANDO_PESO ||
    order.status === ORDER_STATUS.LISTO_PARA_PAGO ||
    Boolean(order.paymentLink)

  return (
    <article className="card p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ─── Columna 1: datos del cliente ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">
              {order.nombre || 'Sin nombre'}
            </h3>
            <StatusBadge tone={tone}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </StatusBadge>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">📞</span>
              <a href={`tel:${order.telefono}`} className="hover:text-brand-600">
                {order.telefono || '—'}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">📍</span>
              <span>{order.direccion || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">🕐</span>
              <FechaCell iso={order.fecha} />
            </div>
          </div>
        </div>

        {/* ─── Columna 2: detalles del servicio ─── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`badge ${
                order.tipoServicio === 'Lavandería'
                  ? 'bg-brand-100 text-brand-800'
                  : 'bg-accent-100 text-accent-800'
              }`}
            >
              {order.tipoServicio}
            </span>
            {order.finalPrice != null && (
              <span className="badge bg-emerald-100 text-emerald-800">
                {order.finalPrice.toFixed(2)} €
              </span>
            )}
          </div>
          <DetallesCell order={order} />
        </div>

        {/* ─── Columna 3: acciones ─── */}
        <div className="space-y-2">
          {/* Tarjeta de pricing (solo si aplica) */}
          {showPricingCard && (
            <OrderPricingCard order={order} onUpdated={onUpdated} />
          )}

          {/* Acciones rápidas según estado */}
          {order.status === ORDER_STATUS.PAGADO && (
            <button
              onClick={() => onMarkCompleted(order)}
              disabled={updatingId === order.id}
              className="btn w-full text-xs bg-slate-900 text-white hover:bg-slate-800"
            >
              {updatingId === order.id ? 'Marcando…' : '✓ Marcar como entregado'}
            </button>
          )}

          {(order.status === ORDER_STATUS.ESPERANDO_PESO ||
            order.status === ORDER_STATUS.LISTO_PARA_PAGO) && (
            <button
              onClick={() => onCancel(order)}
              disabled={updatingId === order.id}
              className="btn-ghost w-full text-xs text-red-600 hover:bg-red-50"
            >
              ✕ Cancelar pedido
            </button>
          )}

          {/* Estado del pago */}
          {order.paymentStatus && (
            <div className="text-xs text-slate-500 text-right">
              Pago: <span className="font-medium">{order.paymentStatus}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────

function DetallesCell({ order }) {
  const d = order.detalles || {}
  if (order.tipoServicio === 'Lavandería') {
    return (
      <div className="text-xs space-y-0.5 text-slate-600">
        <div>
          <span className="text-slate-400">Prenda:</span>{' '}
          <span className="font-medium">{d.tipoPrenda || '—'}</span>
        </div>
        <div>
          <span className="text-slate-400">Peso:</span>{' '}
          <span className="font-medium">
            {d.pesoKg ? `${d.pesoKg} kg` : '—'}
          </span>
        </div>
        {d.notas && (
          <div className="text-slate-500 italic">“{d.notas}”</div>
        )}
      </div>
    )
  }
  return (
    <div className="text-xs space-y-0.5 text-slate-600">
      <div>
        <span className="text-slate-400">Habitaciones:</span>{' '}
        <span className="font-medium">{d.numHabitaciones || '—'}</span>
      </div>
      <div>
        <span className="text-slate-400">Tipo:</span>{' '}
        <span className="font-medium">{d.tipoLimpieza || '—'}</span>
      </div>
      {d.notas && <div className="text-slate-500 italic">“{d.notas}”</div>}
    </div>
  )
}

function FechaCell({ iso }) {
  if (!iso) return <span>—</span>
  try {
    const date = new Date(iso)
    return (
      <span>
        {date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}{' '}
        ·{' '}
        {date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    )
  } catch {
    return <span>—</span>
  }
}

function StatusBadge({ tone, children }) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    brand: 'bg-brand-100 text-brand-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`badge ${tones[tone] || tones.slate}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
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

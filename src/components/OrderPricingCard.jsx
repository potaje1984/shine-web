// src/components/OrderPricingCard.jsx
// ──────────────────────────────────────────────────────────────────────────
// Tarjeta que se muestra en el panel admin para cada pedido que está
// en estado 'esperando_peso' o 'listo_para_pago'.
//
// Funciones:
//  • Input para que el admin introduzca finalPrice (€)
//  • Botón "Fijar precio" → llama a updateOrderPrice Cloud Function
//  • Tras fijar el precio, muestra botón "Generar link de pago"
//  • Tras generar el link, lo muestra con botón de copiar y abrir
// ──────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import {
  setOrderFinalPrice,
  generatePaymentLink,
  ORDER_STATUS,
} from '../firebase/ordersApi'

export default function OrderPricingCard({ order, onUpdated }) {
  const [price, setPrice] = useState(
    order.finalPrice ? String(order.finalPrice) : '',
  )
  const [busy, setBusy] = useState(null) // 'pricing' | 'link' | null
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSetPrice(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const num = Number(price)
    if (!price || isNaN(num) || num <= 0) {
      setError('Introduce un precio válido (mayor que 0).')
      return
    }

    setBusy('pricing')
    try {
      const res = await setOrderFinalPrice(order.id, num)
      setSuccess(res?.message || 'Precio fijado correctamente.')
      if (onUpdated) onUpdated()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo fijar el precio.')
    } finally {
      setBusy(null)
    }
  }

  async function handleGenerateLink() {
    setError('')
    setSuccess('')
    setBusy('link')
    try {
      const res = await generatePaymentLink(order.id)
      setSuccess('Link de pago generado. Compártelo con el cliente.')
      if (onUpdated) onUpdated()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo generar el link de pago.')
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(order.paymentLink || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('No se pudo copiar:', err)
    }
  }

  const isEsperandoPeso = order.status === ORDER_STATUS.ESPERANDO_PESO
  const isListoParaPago = order.status === ORDER_STATUS.LISTO_PARA_PAGO
  const hasPaymentLink = Boolean(order.paymentLink)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">
          💰 Gestión de precio
        </h4>
        {order.finalPrice != null && (
          <span className="badge bg-emerald-100 text-emerald-800">
            {order.finalPrice.toFixed(2)} €
          </span>
        )}
      </div>

      {/* ─── Formulario para fijar precio ─── */}
      {isEsperandoPeso && (
        <form onSubmit={handleSetPrice} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min="0.01"
              max="9999"
              step="0.01"
              className="input pr-8"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={busy !== null}
              autoFocus
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
              €
            </span>
          </div>
          <button
            type="submit"
            disabled={busy !== null}
            className="btn-primary text-sm"
          >
            {busy === 'pricing' ? 'Fijando…' : 'Fijar precio'}
          </button>
        </form>
      )}

      {/* ─── Mostrar precio fijado + acciones ─── */}
      {(isListoParaPago || hasPaymentLink) && (
        <div className="space-y-2">
          {order.finalPrice != null && (
            <div className="text-sm text-slate-600">
              Precio fijado en{' '}
              <span className="font-semibold text-slate-900">
                {order.finalPrice.toFixed(2)} €
              </span>{' '}
              por {order.pricedBy || 'admin'}.
            </div>
          )}

          {/* Botón para generar link */}
          {!hasPaymentLink && isListoParaPago && (
            <button
              onClick={handleGenerateLink}
              disabled={busy !== null}
              className="btn-accent w-full text-sm"
            >
              {busy === 'link' ? (
                'Generando link…'
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Generar link de pago
                </>
              )}
            </button>
          )}

          {/* Link generado */}
          {hasPaymentLink && (
            <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <LinkIcon className="h-3 w-3" />
                Link de pago:
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  className="input text-xs font-mono"
                  value={order.paymentLink}
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={copyLink}
                  className="btn-secondary text-xs px-3"
                  title="Copiar link"
                >
                  {copied ? '✓' : 'Copiar'}
                </button>
              </div>
              <a
                href={order.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full text-xs"
              >
                🔗 Abrir link en nueva pestaña
              </a>
              <button
                onClick={handleGenerateLink}
                disabled={busy !== null}
                className="btn-ghost w-full text-xs"
                title="Genera un nuevo link si el anterior expiró"
              >
                ↻ Generar nuevo link
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Mensajes ─── */}
      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
          {success}
        </div>
      )}
    </div>
  )
}

function LinkIcon({ className = '' }) {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

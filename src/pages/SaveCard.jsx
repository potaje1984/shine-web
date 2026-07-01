// src/pages/SaveCard.jsx
// ──────────────────────────────────────────────────────────────────────────
// Página para que el cliente registre su tarjeta de forma segura.
//
// Flujo:
//   1. Monta la página → llama a createSetupIntent() para obtener clientSecret
//   2. Inicializa Stripe Elements con ese clientSecret
//   3. Renderiza <PaymentElement> (PCI-scoped iframe de Stripe)
//   4. Al enviar → stripe.confirmSetup() confirma en Stripe
//   5. Si OK → savePaymentMethod(paymentMethodId) persiste en Firestore
//   6. Muestra listado de tarjetas guardadas
//
// Seguridad:
//   • El número de tarjeta NUNCA toca nuestro código: vive en un iframe
//     de Stripe (pci-scope).
//   • Solo almacenamos el paymentMethodId y metadatos públicos (brand, last4).
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { useAuth } from '../context/AuthContext'
import {
  createSetupIntent,
  savePaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
} from '../firebase/paymentsApi'

// Inicializa Stripe.js con la publishable key del settings.
// En una versión mejorada, deberíamos leerla de Firestore en tiempo real;
// por simplicidad aquí la tomamos de una variable de entorno o settings.
import { getPaymentSettings } from '../firebase/settingsApi'

export default function SaveCard() {
  const { user, isAuthenticated } = useAuth()
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [publishableKey, setPublishableKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        // 1. Cargar publishable key desde Firestore settings
        const settings = await getPaymentSettings()
        if (!settings?.publishableKey) {
          throw new Error('No hay publishable key configurada. Pide al admin que la configure en /admin/payment-settings.')
        }
        setPublishableKey(settings.publishableKey)

        // 2. Inicializar Stripe.js
        setStripePromise(loadStripe(settings.publishableKey))

        // 3. Crear SetupIntent en el backend
        const { clientSecret: cs } = await createSetupIntent()
        setClientSecret(cs)
      } catch (err) {
        console.error(err)
        setError(err.message || 'No se pudo inicializar el registro de tarjeta.')
      } finally {
        setLoading(false)
      }
    })()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Inicia sesión para registrar tu tarjeta
        </h1>
        <p className="mt-2 text-slate-600">
          Necesitas una cuenta para guardar tu método de pago.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="card p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-brand-500" />
          <p className="mt-3 text-sm text-slate-500">
            Preparando formulario seguro…
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <div className="card p-6 border-red-200 bg-red-50">
          <h1 className="text-xl font-bold text-red-800">Error</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link to="/" className="btn-secondary mt-4 inline-flex">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Mi método de pago
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registra tu tarjeta para pagos rápidos. Tus datos están protegidos
          por Stripe (PCI-DSS Level 1).
        </p>
      </header>

      {/* Tarjetas guardadas */}
      <SavedCardsSection userId={user?.uid} />

      {/* Formulario Stripe Elements */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Añadir nueva tarjeta
        </h2>
        {clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'stripe' } }}
          >
            <SetupForm
              clientSecret={clientSecret}
              publishableKey={publishableKey}
              onSaved={() => window.location.reload()}
            />
          </Elements>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Formulario dentro de <Elements> que usa stripe.confirmSetup()
// ──────────────────────────────────────────────────────────────────────

function SetupForm({ clientSecret, onSaved }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!stripe || !elements) {
      setError('Stripe aún no está listo. Espera unos segundos.')
      setSubmitting(false)
      return
    }

    try {
      // Confirmar el SetupIntent en Stripe. Esto valida la tarjeta.
      // Stripe puede requerir 3DS; el SDK lo maneja automáticamente.
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      })

      if (stripeError) {
        throw stripeError
      }

      if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        // Persistir en Firestore vía Cloud Function
        await savePaymentMethod(setupIntent.payment_method)
        setSuccess(true)
        setTimeout(() => onSaved?.(), 1500)
      } else {
        setError(`Estado inesperado: ${setupIntent.status}`)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo registrar la tarjeta.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-slide-up">
        <strong>✓ Tarjeta registrada.</strong> Ya puedes usarla para tus pagos.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-primary w-full"
      >
        {submitting ? (
          <>
            <Spinner /> Registrando…
          </>
        ) : (
          <>
            <LockIcon className="h-4 w-4" />
            Registrar tarjeta
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        🔒 Stripe valida la tarjeta sin cobrar. Pueden aparecer 0,00 €
        temporalmente en tu banco; se cancelan automáticamente.
      </p>
    </form>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Sección de tarjetas ya guardadas
// ──────────────────────────────────────────────────────────────────────

function SavedCardsSection() {
  const [cards, setCards] = useState([])
  const [defaultId, setDefaultId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  async function load() {
    try {
      const res = await listPaymentMethods()
      setCards(res.paymentMethods || [])
      setDefaultId(res.defaultPaymentMethodId)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSetDefault(id) {
    setBusy(id)
    try {
      const res = await setDefaultPaymentMethod(id)
      setCards(res.paymentMethods || [])
      setDefaultId(res.defaultPaymentMethodId)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove(id) {
    if (!confirm('¿Eliminar esta tarjeta?')) return
    setBusy(id)
    try {
      const res = await removePaymentMethod(id)
      setCards(res.paymentMethods || [])
      setDefaultId(res.defaultPaymentMethodId)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return null
  if (cards.length === 0) return null

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Tarjetas guardadas
      </h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
              card.isDefault || card.id === defaultId
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <CardBrandIcon brand={card.brand} />
              <div>
                <div className="text-sm font-medium text-slate-900">
                  •••• {card.last4}
                </div>
                <div className="text-xs text-slate-500">
                  {card.brand} · {String(card.expMonth).padStart(2, '0')}/
                  {String(card.expYear).slice(-2)}
                </div>
              </div>
              {card.isDefault && (
                <span className="badge bg-emerald-100 text-emerald-800">
                  Por defecto
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!card.isDefault && (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  disabled={busy !== null}
                  className="text-xs text-slate-600 hover:text-brand-600"
                >
                  Hacer default
                </button>
              )}
              <button
                onClick={() => handleRemove(card.id)}
                disabled={busy !== null}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Helpers visuales
// ──────────────────────────────────────────────────────────────────────

function CardBrandIcon({ brand }) {
  const label = brand === 'visa'
    ? 'VISA'
    : brand === 'mastercard'
      ? 'MC'
      : brand === 'amex'
        ? 'AMEX'
        : '💳'
  return (
    <span className="grid h-8 w-12 place-items-center rounded-md bg-slate-900 text-white text-[10px] font-bold">
      {label}
    </span>
  )
}

function LockIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

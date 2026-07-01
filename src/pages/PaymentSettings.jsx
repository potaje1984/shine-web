// src/pages/PaymentSettings.jsx
// ──────────────────────────────────────────────────────────────────────────
// Panel de configuración de la pasarela de pago (solo admin).
//
// Arquitectura de seguridad:
//   • Campos PÚBLICOS (provider, publishableKey, active)
//     → se guardan en Firestore `settings/payment-gateway`.
//   • Campos SECRETOS (secret key / access token)
//     → se envían a la Cloud Function `setPaymentSecret` mediante
//       Callable Function, que los almacena en Cloud Functions env vars
//       (encriptados) sin tocar Firestore.
//
// Ruta: /admin/payment-settings
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getPaymentSettings,
  savePaymentSettings,
  isSecretKeyConfigured,
} from '../firebase/settingsApi'
import { callFunction } from '../firebase/functionsConfig'
import AdminNav from '../components/AdminNav'

const PROVIDERS = [
  {
    id: 'stripe',
    name: 'Stripe',
    publishableHint: 'pk_test_... o pk_live_...',
    secretHint: 'sk_test_... o sk_live_...',
    docs: 'https://dashboard.stripe.com/apikeys',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    publishableHint: 'TEST-xxxx-xxxx-xxxx (Public key)',
    secretHint: 'TEST-xxxx-xxxx-xxxx (Access token)',
    docs: 'https://www.mercadopago.com/mla/account/credentials',
  },
]

export default function PaymentSettings() {
  const { user } = useAuth()

  const [provider, setProvider] = useState('stripe')
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [active, setActive] = useState(false)
  const [secretConfigured, setSecretConfigured] = useState(false)

  const [loading, setLoading] = useState(true)
  const [savingPublic, setSavingPublic] = useState(false)
  const [savingSecret, setSavingSecret] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'success' | 'error', text }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [settings, hasSecret] = await Promise.all([
          getPaymentSettings(),
          isSecretKeyConfigured(),
        ])
        if (!mounted) return
        if (settings) {
          setProvider(settings.provider || 'stripe')
          setPublishableKey(settings.publishableKey || '')
          setActive(Boolean(settings.active))
        }
        setSecretConfigured(hasSecret)
      } catch (err) {
        console.error(err)
        setMsg({ type: 'error', text: 'No se pudo cargar la configuración.' })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const currentProvider = PROVIDERS.find((p) => p.id === provider)

  async function handleSavePublic(e) {
    e.preventDefault()
    setMsg(null)
    if (!publishableKey.trim()) {
      setMsg({ type: 'error', text: 'La publishable key es obligatoria.' })
      return
    }
    setSavingPublic(true)
    try {
      await savePaymentSettings({
        provider,
        publishableKey: publishableKey.trim(),
        active,
        updatedBy: user?.email || 'unknown',
      })
      setMsg({ type: 'success', text: 'Configuración pública guardada.' })
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSavingPublic(false)
    }
  }

  async function handleSaveSecret(e) {
    e.preventDefault()
    setMsg(null)
    if (!secretKey.trim()) {
      setMsg({ type: 'error', text: 'Introduce la secret key.' })
      return
    }
    if (!confirm('¿Confirmas que quieres actualizar la secret key? Esto impactará inmediatamente en los cobros.')) {
      return
    }
    setSavingSecret(true)
    try {
      // Callable Function: el valor viaja cifrado HTTPS al backend,
      // NUNCA se persiste en Firestore, solo en env vars de Cloud Functions.
      // La URL (dev/prod) se resuelve automáticamente en functionsConfig.js
      const res = await callFunction('setPaymentSecret', {
        provider,
        secretKey: secretKey.trim(),
      })
      if (res?.ok) {
        setSecretConfigured(true)
        setSecretKey('') // limpiamos el input por seguridad
        setMsg({ type: 'success', text: 'Secret key guardada en el servidor.' })
      } else {
        throw new Error(res?.error || 'Error desconocido')
      }
    } catch (err) {
      console.error(err)
      setMsg({
        type: 'error',
        text: 'No se pudo guardar la secret key. ¿Está desplegada la Cloud Function?',
      })
    } finally {
      setSavingSecret(false)
    }
  }

  if (loading) {
    return (
      <div className="container-page py-10">
        <AdminNav />
        <div className="mt-8 card p-12 text-center text-slate-500">
          Cargando configuración…
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <AdminNav current="payment-settings" />

      <header className="mt-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Configuración de pago
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona la pasarela de pago de forma segura. Las claves públicas se
          guardan en Firestore; las privadas en el servidor.
        </p>
      </header>

      {/* Mensaje */}
      {msg && (
        <div
          role="alert"
          className={`mb-6 rounded-xl border p-3 text-sm ${
            msg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ───────────── Sección 1: Configuración pública ───────────── */}
        <form onSubmit={handleSavePublic} className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Clave pública
            </h2>
            <span className="badge bg-emerald-100 text-emerald-800">
              <LockOpenIcon className="h-3 w-3" /> Safe para frontend
            </span>
          </div>

          {/* Provider */}
          <div>
            <label className="label">Proveedor</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => {
                const activeProv = provider === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      activeProv
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-200'
                    }`}
                    aria-pressed={activeProv}
                  >
                    <span className="block text-sm font-semibold text-slate-800">
                      {p.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {p.id === 'stripe' ? 'Global' : 'Latam'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Publishable key */}
          <div>
            <label htmlFor="publishableKey" className="label">
              Publishable key <span className="text-red-500">*</span>
            </label>
            <input
              id="publishableKey"
              type="text"
              className="input font-mono text-xs"
              placeholder={currentProvider?.publishableHint}
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-500">
              Esta clave viaja al navegador del cliente para inicializar
              el SDK. Es pública por diseño.
            </p>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              Activar pasarela (los clientes podrán pagar al hacer pedido)
            </span>
          </label>

          <button
            type="submit"
            disabled={savingPublic}
            className="btn-primary w-full"
          >
            {savingPublic ? 'Guardando…' : 'Guardar configuración pública'}
          </button>

          <a
            href={currentProvider?.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-brand-600 hover:underline"
          >
            ¿Dónde encuentro mis claves? →
          </a>
        </form>

        {/* ───────────── Sección 2: Secret key (server-only) ───────────── */}
        <form onSubmit={handleSaveSecret} className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Secret key
            </h2>
            <span
              className={`badge ${
                secretConfigured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {secretConfigured ? '✓ Configurada' : '⚠ Pendiente'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-900 text-slate-200 p-4 text-xs leading-relaxed">
            <strong className="text-amber-300">⚠️ No se guarda en Firestore.</strong>{' '}
            Esta clave se envía mediante una <em>Callable Cloud Function</em>{' '}
            directamente a las variables de entorno del servidor
            (<code>firebase functions:secrets</code>), encriptadas en tránsito
            y en reposo. Nunca toca el navegador del cliente ni la base de
            datos.
          </div>

          <div>
            <label htmlFor="secretKey" className="label">
              {provider === 'stripe' ? 'Secret key' : 'Access token'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="secretKey"
              type="password"
              className="input font-mono text-xs"
              placeholder={currentProvider?.secretHint}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-500">
              {secretConfigured
                ? 'Ya hay una clave configurada. Introduce una nueva solo para rotar.'
                : 'Aún no hay clave configurada. Introúcela para activar cobros.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={savingSecret}
            className="btn-accent w-full"
          >
            {savingSecret
              ? 'Guardando en servidor…'
              : secretConfigured
                ? 'Rotar secret key'
                : 'Guardar secret key en servidor'}
          </button>

          <p className="text-xs text-slate-500 leading-relaxed">
            La Cloud Function debe estar desplegada para que esto funcione.
            Mira <code>functions/README.md</code> para instrucciones de
            despliegue.
          </p>
        </form>
      </div>

      {/* ───────────── Estado actual ───────────── */}
      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Estado actual
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Pasarela"
            value={provider === 'stripe' ? 'Stripe' : 'Mercado Pago'}
            tone="slate"
          />
          <StatusCard
            label="Estado"
            value={active ? 'Activa' : 'Inactiva'}
            tone={active ? 'emerald' : 'slate'}
          />
          <StatusCard
            label="Secret key"
            value={secretConfigured ? 'Configurada' : 'Pendiente'}
            tone={secretConfigured ? 'emerald' : 'amber'}
          />
        </div>
      </div>

      {/* ───────────── Enlaces ───────────── */}
      <div className="mt-8 flex justify-between text-sm">
        <Link to="/admin" className="text-slate-500 hover:text-brand-600">
          ← Volver a pedidos
        </Link>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────

function StatusCard({ label, value, tone }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function LockOpenIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0" />
    </svg>
  )
}

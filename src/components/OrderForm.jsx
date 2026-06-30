import { useState } from 'react'
import { createOrder } from '../firebase/ordersApi'

/**
 * Formulario de pedido dinámico.
 *
 * El campo `tipoServicio` (Lavandería | Limpieza) controla qué campos
 * adicionales se muestran a continuación:
 *
 *  • Lavandería → tipo de prenda + cantidad de kilos
 *  • Limpieza   → número de habitaciones + tipo de limpieza
 *
 * Los datos comunes (nombre, teléfono, dirección) se piden siempre.
 */
const SERVICIOS = ['Lavandería', 'Limpieza']

const TIPOS_PRENDA = [
  'Ropa diaria',
  'Ropa delicada',
  'Ropa de cama',
  'Trajes / vestidos',
  'Cortinas',
]

const TIPOS_LIMPIEZA = [
  'Limpieza general',
  'Limpieza profunda',
  'Limpieza de cocina',
  'Limpieza de baños',
  'Limpieza de cristales',
]

const ESTADO_INICIAL = {
  nombre: '',
  telefono: '',
  direccion: '',
  tipoServicio: 'Lavandería',
  // Lavandería
  tipoPrenda: TIPOS_PRENDA[0],
  pesoKg: '',
  // Limpieza
  numHabitaciones: '',
  tipoLimpieza: TIPOS_LIMPIEZA[0],
  // Notas
  notas: '',
}

export default function OrderForm() {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    // Limpia el error del campo cuando el usuario escribe
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  function validate() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Introduce tu nombre.'
    if (!/^[+\d][\d\s-]{6,}$/.test(form.telefono.trim()))
      e.telefono = 'Teléfono inválido.'
    if (!form.direccion.trim()) e.direccion = 'Introduce tu dirección.'

    if (form.tipoServicio === 'Lavandería') {
      const peso = Number(form.pesoKg)
      if (!form.pesoKg || isNaN(peso) || peso <= 0)
        e.pesoKg = 'Indica los kilos aprox.'
      if (peso > 50) e.pesoKg = 'Máximo 50 kg por pedido.'
    } else {
      const hab = Number(form.numHabitaciones)
      if (!form.numHabitaciones || isNaN(hab) || hab < 1)
        e.numHabitaciones = 'Mínimo 1 habitación.'
      if (hab > 20) e.numHabitaciones = 'Máximo 20 habitaciones.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSuccess(false)
    setErrorMsg('')

    if (!validate()) return

    // Construye el objeto "detalles" según el tipo de servicio
    const detalles =
      form.tipoServicio === 'Lavandería'
        ? {
            tipoPrenda: form.tipoPrenda,
            pesoKg: Number(form.pesoKg),
            notas: form.notas.trim(),
          }
        : {
            numHabitaciones: Number(form.numHabitaciones),
            tipoLimpieza: form.tipoLimpieza,
            notas: form.notas.trim(),
          }

    setSubmitting(true)
    try {
      await createOrder({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        tipoServicio: form.tipoServicio,
        detalles,
      })
      setSuccess(true)
      setForm({ ...ESTADO_INICIAL, tipoServicio: form.tipoServicio })
    } catch (err) {
      console.error(err)
      setErrorMsg(
        'No pudimos registrar tu pedido. Verifica la conexión con Firebase y tus credenciales.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const esLavanderia = form.tipoServicio === 'Lavandería'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ---------- Selector de servicio ---------- */}
      <fieldset>
        <legend className="label">Tipo de servicio</legend>
        <div className="grid grid-cols-2 gap-3">
          {SERVICIOS.map((s) => {
            const active = form.tipoServicio === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => update('tipoServicio', s)}
                className={`group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-50 shadow-soft'
                    : 'border-slate-200 bg-white hover:border-brand-200'
                }`}
                aria-pressed={active}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-lg ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {s === 'Lavandería' ? (
                    <WashingIcon className="h-5 w-5" />
                  ) : (
                    <BroomIcon className="h-5 w-5" />
                  )}
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${
                      active ? 'text-brand-800' : 'text-slate-700'
                    }`}
                  >
                    {s}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {s === 'Lavandería'
                      ? 'Por peso o prenda'
                      : 'Hogar y oficinas'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* ---------- Datos de contacto ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" error={errors.nombre} required>
          <input
            type="text"
            className="input"
            placeholder="Ej. María García"
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
          />
        </Field>
        <Field label="Teléfono" error={errors.telefono} required>
          <input
            type="tel"
            className="input"
            placeholder="Ej. +34 600 000 000"
            value={form.telefono}
            onChange={(e) => update('telefono', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Dirección de recogida" error={errors.direccion} required>
        <input
          type="text"
          className="input"
          placeholder="Calle, número, piso, código postal"
          value={form.direccion}
          onChange={(e) => update('direccion', e.target.value)}
        />
      </Field>

      {/* ---------- Campos dinámicos ---------- */}
      {esLavanderia ? (
        <div className="rounded-xl bg-brand-50/50 border border-brand-100 p-4 space-y-4 animate-fade-in">
          <h4 className="text-sm font-semibold text-brand-800 flex items-center gap-2">
            <WashingIcon className="h-4 w-4" />
            Detalles de lavandería
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de prenda">
              <select
                className="input"
                value={form.tipoPrenda}
                onChange={(e) => update('tipoPrenda', e.target.value)}
              >
                {TIPOS_PRENDA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad (kg)" error={errors.pesoKg} required>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                className="input"
                placeholder="Ej. 7.5"
                value={form.pesoKg}
                onChange={(e) => update('pesoKg', e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-accent-50/50 border border-accent-100 p-4 space-y-4 animate-fade-in">
          <h4 className="text-sm font-semibold text-accent-800 flex items-center gap-2">
            <BroomIcon className="h-4 w-4" />
            Detalles de limpieza
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nº de habitaciones"
              error={errors.numHabitaciones}
              required
            >
              <input
                type="number"
                min="1"
                max="20"
                className="input"
                placeholder="Ej. 3"
                value={form.numHabitaciones}
                onChange={(e) => update('numHabitaciones', e.target.value)}
              />
            </Field>
            <Field label="Tipo de limpieza">
              <select
                className="input"
                value={form.tipoLimpieza}
                onChange={(e) => update('tipoLimpieza', e.target.value)}
              >
                {TIPOS_LIMPIEZA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* ---------- Notas opcionales ---------- */}
      <Field label="Notas (opcional)">
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder="Indicaciones especiales, fragancias, alergias, accesos al inmueble…"
          value={form.notas}
          onChange={(e) => update('notas', e.target.value)}
        />
      </Field>

      {/* ---------- Feedback ---------- */}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-slide-up">
          <strong>¡Pedido registrado!</strong> Nuestro equipo se pondrá en
          contacto contigo en breve para confirmar la hora de recogida.
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* ---------- Submit ---------- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1"
        >
          {submitting ? (
            <>
              <Spinner /> Enviando…
            </>
          ) : (
            <>
              <SparkleIcon className="h-4 w-4" />
              Solicitar pedido
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(ESTADO_INICIAL)
            setErrors({})
            setSuccess(false)
          }}
          className="btn-secondary"
        >
          Limpiar
        </button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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

function WashingIcon({ className = '' }) {
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
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M12 11a2 2 0 0 0-2 2" />
    </svg>
  )
}

function BroomIcon({ className = '' }) {
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
      <path d="M19.36 2.64a3 3 0 0 1 0 4.24l-7.07 7.07-4.24-4.24 7.07-7.07a3 3 0 0 1 4.24 0z" />
      <path d="M8.05 13.47 4.5 17.01a2 2 0 0 0 0 2.83l.66.66a2 2 0 0 0 2.83 0l3.54-3.55" />
      <path d="M3 21h6" />
    </svg>
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

import OrderForm from '../components/OrderForm'

/**
 * Página principal (ruta '/').
 * Hero + Servicios + Cómo funciona + Formulario de pedido.
 */
export default function Home() {
  return (
    <>
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 to-white">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(40rem 20rem at 80% -10%, rgba(16,182,239,0.18), transparent), radial-gradient(30rem 15rem at 0% 30%, rgba(254,124,15,0.10), transparent)',
          }}
        />
        <div className="container-page py-16 sm:py-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in">
            <span className="badge bg-brand-100 text-brand-800 mb-4">
              ✨ Servicio a domicilio
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
              Tu ropa y tu hogar,{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                impecables
              </span>{' '}
              sin moverte de casa.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              Recogida, tratamiento profesional y entrega en 24–48 h.
              Lavandería por peso y limpieza del hogar con personal verificado.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#pedido" className="btn-primary">
                <SparkleIcon className="h-4 w-4" />
                Solicitar pedido
              </a>
              <a href="#servicios" className="btn-secondary">
                Ver servicios
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
              <Stat value="24 h" label="Entrega media" />
              <Stat value="4.9★" label="Valoración media" />
              <Stat value="+5.000" label="Pedidos completados" />
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="card p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                  <SparkleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-slate-900">
                    Pide en 2 minutos
                  </p>
                  <p className="text-xs text-slate-500">
                    Sin registro previo
                  </p>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Recogemos en tu domicilio en franja horaria elegida',
                  'Tratamiento profesional según tipo de prenda o estancia',
                  'Entrega doblada, planchada y lista para usar',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span className="text-slate-700">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Servicios ─────────── */}
      <section id="servicios" className="container-page py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Servicios profesionales
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Soluciones a medida para cada necesidad, con productos
            eco-friendly y personal formado.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ServiceCard
            tone="brand"
            icon={<WashingIcon className="h-7 w-7" />}
            title="Lavandería"
            tagline="Por peso o por prenda"
            description="Lavado, secado y planchado de ropa diaria, delicada, de cama y trajes. Tratamientos específicos para cada tejido."
            features={[
              'Recogida por kg o prenda',
              'Detergentes hipoalergénicos',
              'Planchado profesional',
              'Entrega doblada y empaquetada',
            ]}
          />
          <ServiceCard
            tone="accent"
            icon={<BroomIcon className="h-7 w-7" />}
            title="Limpieza"
            tagline="Hogar y oficinas"
            description="Limpieza general, profunda y específica de cocinas, baños o cristales. Personal verificado y productos eco-friendly."
            features={[
              'Personal verificado',
              'Productos eco-friendly',
              'Limpieza profunda opcional',
              'Franjas horarias flexibles',
            ]}
          />
        </div>
      </section>

      {/* ─────────── Cómo funciona ─────────── */}
      <section
        id="como-funciona"
        className="bg-white border-y border-slate-100 py-16 scroll-mt-20"
      >
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Cómo funciona
            </h2>
            <p className="mt-2 text-slate-600">
              Tres pasos sencillos. Tú pides, nosotros nos encargamos.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                n: 1,
                title: 'Rellena el pedido',
                text: 'Indica tu dirección y el tipo de servicio. Te llamamos para confirmar la franja horaria.',
              },
              {
                n: 2,
                title: 'Recogemos y tratamos',
                text: 'Nuestro equipo pasa a recoger y aplica el tratamiento adecuado a cada prenda o estancia.',
              },
              {
                n: 3,
                title: 'Entregamos impecable',
                text: 'En 24–48 h lo tienes de vuelta, doblado, planchado y listo para disfrutar.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="card p-6 relative overflow-hidden"
              >
                <div className="absolute -top-3 -right-3 text-7xl font-bold text-brand-50 font-display select-none">
                  {step.n}
                </div>
                <div className="relative">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white font-bold">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-semibold text-lg text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Formulario de pedido ─────────── */}
      <section id="pedido" className="container-page py-16 scroll-mt-20">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="badge bg-accent-100 text-accent-800 mb-3">
              📝 Pedido online
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Solicita tu servicio
            </h2>
            <p className="mt-3 text-slate-600">
              Rellena el formulario y nuestro equipo te contactará en menos de
              30 minutos para confirmar la recogida. Sin compromiso.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-emerald-600" /> Atención de
                lunes a sábado
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-emerald-600" /> Presupuesto
                sin compromiso
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-emerald-600" /> Pagos
                seguros contra entrega
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <div className="card p-6 sm:p-8">
              <OrderForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-2xl font-bold text-slate-900 font-display">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide">{label}</div>
    </div>
  )
}

function ServiceCard({
  tone = 'brand',
  icon,
  title,
  tagline,
  description,
  features,
}) {
  const tones = {
    brand: 'bg-brand-600 text-white',
    accent: 'bg-accent-500 text-white',
  }
  return (
    <article className="card p-6 sm:p-8 hover:shadow-soft transition-shadow">
      <div className="flex items-start gap-4">
        <span
          className={`grid h-14 w-14 place-items-center rounded-2xl ${tones[tone]} shadow-soft`}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {tagline}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <CheckIcon className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </article>
  )
}

function CheckIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
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

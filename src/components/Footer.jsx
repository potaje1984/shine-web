/**
 * Footer reutilizable — datos de contacto, horario y enlaces legales.
 */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 bg-slate-900 text-slate-300">
      <div className="container-page py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
              <SparkleIcon className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold text-white">Shine</span>
          </div>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Lavandería y limpieza profesional a domicilio. Recogemos,
            tratamos y entregamos tu ropa y tu hogar impecables.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Servicios</h4>
          <ul className="space-y-2 text-sm">
            <li>Lavandería por peso</li>
            <li>Lavado de prendas delicadas</li>
            <li>Limpieza del hogar</li>
            <li>Limpieza profunda</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>📞 +34 600 000 000</li>
            <li>✉️ hola@shine.com</li>
            <li>📍 Calle Limpia 12, Madrid</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Horario</h4>
          <ul className="space-y-2 text-sm">
            <li>Lun – Vie · 8:00 – 20:00</li>
            <li>Sábado · 9:00 – 18:00</li>
            <li>Domingo · Cerrado</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© {year} Shine. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Aviso legal</a>
            <a href="#" className="hover:text-slate-300">Privacidad</a>
            <a href="#" className="hover:text-slate-300">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
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

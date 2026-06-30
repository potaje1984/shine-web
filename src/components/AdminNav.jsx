// src/components/AdminNav.jsx
// ──────────────────────────────────────────────────────────────────────────
// Subnavegación dentro del panel de administración.
// Permite moverse entre:
//   • /admin                    → pedidos
//   • /admin/payment-settings   → configuración de pago
// ──────────────────────────────────────────────────────────────────────────

import { NavLink } from 'react-router-dom'

const items = [
  { to: '/admin', label: 'Pedidos', icon: '📋', end: true },
  { to: '/admin/payment-settings', label: 'Configuración de pago', icon: '💳' },
]

export default function AdminNav({ current }) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-slate-200 pb-3"
      aria-label="Secciones del panel"
    >
      {items.map((item) => {
        const isActive =
          current === item.label.replace(/\s/g, '-').toLowerCase() ||
          (item.end && current === undefined)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive: navActive }) =>
              `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                navActive || isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

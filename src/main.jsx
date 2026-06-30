import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

// ──────────────────────────────────────────────────────────────────────
// Calcular el basename de React Router según dónde se sirve la app.
//
// En desarrollo (Vite) → basename = '/'
// En GitHub Pages Project Site → basename = '/shine-web/'
//
// Vite inyecta import.meta.env.BASE_URL automáticamente desde
// vite.config.js → `base`.
// ──────────────────────────────────────────────────────────────────────
const basename = import.meta.env.BASE_URL || '/'

// El orden de los providers importa:
//   BrowserRouter → AuthProvider → App
// Así AuthProvider puede usar useNavigate / useLocation si lo necesita,
// y App consume el contexto vía useAuth().
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

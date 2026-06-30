# Shine 🧺✨

Web profesional de **servicios de lavandería y limpieza a domicilio**. Aplicación web estándar (no PWA) construida con **React + Vite + Tailwind CSS** y conectada a **Firebase Firestore**.

![Stack](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20Tailwind%20%7C%20Firebase-blue)

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| **Home (`/`)** | Hero, servicios, "cómo funciona" y formulario de pedido integrado. |
| **Formulario dinámico** | El campo *Tipo de Servicio* (Lavandería / Limpieza) muestra campos adicionales específicos. |
| **Admin (`/admin`)** | Tabla de todos los pedidos con filtros por tipo y toggle de estado Pendiente ⇄ Completado. **Protegido con Firebase Auth.** |
| **Admin (`/admin/payment-settings`)** | Configuración de la pasarela de pago (Stripe / Mercado Pago). **Protegido.** |
| **Login (`/login`)** | Inicio de sesión email + password con `signInWithEmailAndPassword`. |
| **ProtectedRoute** | Componente que envuelve rutas privadas; redirige a `/login` si no hay sesión. |
| **Firebase Firestore** | Persistencia en tiempo real con estructura normalizada de pedidos. |
| **Firebase Auth** | Email/Password. Sesión persistente (localStorage). |
| **Firebase Cloud Functions** | Procesamiento seguro de pagos Stripe + webhooks. |
| **Stripe / Mercado Pago** | Pasarela de pago con claves gestionadas de forma segura. |
| **Diseño responsive** | Mobile-first, accesible y con paleta fresca (azul/amarillo). |

### Campos dinámicos del formulario

- **Lavandería** → tipo de prenda + peso (kg)
- **Limpieza** → número de habitaciones + tipo de limpieza

### Estructura del documento en Firestore

```js
// Colección: orders
{
  nombre:        string,
  telefono:      string,
  direccion:     string,
  tipoServicio:  'Lavandería' | 'Limpieza',
  detalles: {
    // Lavandería:
    tipoPrenda:  string,
    pesoKg:      number,
    // Limpieza:
    numHabitaciones: number,
    tipoLimpieza:    string,
    // Común:
    notas:       string,
  },
  fecha:     string,  // ISO
  estado:    'Pendiente' | 'Completado',  // default 'Pendiente'
  createdAt: timestamp,
}
```

---

## 🚀 Puesta en marcha

### 1. Requisitos

- Node.js **18+** (recomendado 20+)
- npm 9+

### 2. Instalación

```bash
git clone https://github.com/potaje1984/shine-web.git
cd shine-web
npm install
```

### 3. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto.
2. **Añade una Web App** (icono `</>`) y copia los valores del SDK.
3. **Crea Firestore Database** (modo producción o pruebas).
4. **Activa Authentication:**
   - En el menú lateral → **Authentication → Sign-in method**
   - Click en **Email/Password** → **Enable → Save**
5. **Crea tu usuario admin:**
   - Ve a **Authentication → Users → Add user**
   - Introduce email + contraseña (ej: `admin@shine.com` / `tu-password-seguro`)
6. Copia `.env.example` a `.env` y rellena tus credenciales:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. (Opcional) Aplica las reglas de seguridad del archivo `firestore.rules` en:
   `Firebase Console → Firestore → Rules`.

### 4. Arrancar en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:5173`.

### 5. Build de producción

```bash
npm run build      # genera /dist
npm run preview    # sirve el build localmente
```

---

## 🗂️ Estructura del proyecto

```
shine-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.jsx            # Barra de navegación sticky (con login/logout)
│   │   ├── Footer.jsx            # Footer corporativo
│   │   ├── OrderForm.jsx         # Formulario dinámico con validación
│   │   ├── AdminPanel.jsx        # Tabla + filtros + toggle de estado
│   │   └── ProtectedRoute.jsx    # Guard de rutas privadas
│   ├── pages/
│   │   ├── Home.jsx              # Hero + servicios + cómo funciona + form
│   │   ├── Admin.jsx             # Página /admin (protegida)
│   │   └── Login.jsx             # Página /login (email + password)
│   ├── context/
│   │   └── AuthContext.jsx       # Provider de auth con useAuth, login, logout, signup
│   ├── firebase/
│   │   ├── config.js             # Inicialización de Firebase (db + auth)
│   │   └── ordersApi.js          # CRUD de la colección `orders`
│   ├── App.jsx                   # Layout + Router
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind + estilos globales
├── firestore.rules               # Reglas de seguridad (create público, read auth)
├── .env.example                  # Plantilla de variables de entorno
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## 🧭 Rutas

| Ruta | Componente | Protegida | Descripción |
|------|------------|-----------|-------------|
| `/` | `Home` | ❌ | Landing + formulario de pedido |
| `/login` | `Login` | ❌ | Inicio de sesión admin |
| `/admin` | `Admin` | ✅ | Panel de gestión de pedidos |
| `/admin/payment-settings` | `PaymentSettings` | ✅ | Configuración de la pasarela de pago |
| `*` | — | ❌ | Página 404 |

### Flujo de autenticación

```
Usuario entra a /admin
        │
        ▼
ProtectedRoute verifica useAuth()
        │
   ┌────┴────┐
   │         │
loading    user?
   │         │
spinner    ┌─┴──┐
           │    │
          no   sí
           │    │
           ▼    ▼
       /login  <Admin/>
           │
           ▼
   tras login → /admin
```

---

## 🔐 Seguridad

- **Nunca** subas tu archivo `.env` a Git (ya está en `.gitignore`).
- Las reglas de `firestore.rules` permiten creación pública de pedidos pero
  en **producción** debes restringir la lectura/escritura del panel admin
  mediante autenticación Firebase Auth + custom claims.
- Considera migrar a **Firebase Auth** con login para el panel `/admin`.

---

## 💳 Pasarela de pago (Stripe / Mercado Pago)

### Arquitectura de seguridad

El principio fundamental es que **las secret keys nunca tocan el navegador del cliente ni Firestore**. Solo se procesan dentro de Cloud Functions donde el cliente no puede acceder a ellas.

```
┌─────────────────┐   publishableKey     ┌──────────────┐
│  Admin Browser  │ ─────────────────→   │   Firestore  │
│  (frontend)     │                      │  settings/   │
└────────┬────────┘                      └──────────────┘
         │
         │ secretKey (HTTPS Callable)
         ↓
┌────────────────────┐  process.env    ┌──────────────┐
│ setPaymentSecret   │ ←─────────────  │ Cloud KMS    │
│  Cloud Function    │                 │ (encriptado) │
└────────────────────┘                 └──────────────┘

┌────────────────────┐  process.env    ┌──────────────┐
│createCheckoutSes   │ ←─────────────  │ Cloud Run env│
│  Cloud Function    │                 │  vars        │
└────────────────────┘                 └──────────────┘
```

### Reglas de oro

| Tipo de clave | Dónde guardarla | Por qué |
|---|---|---|
| `pk_test_*` / `pk_live_*` (publishable) | ✅ Firestore `settings/` | Pública por diseño |
| `sk_test_*` / `sk_live_*` (secret) | ✅ `firebase functions:secrets` | Solo servidor |
| `whsec_*` (webhook secret) | ✅ `firebase functions:secrets` | Solo servidor |
| Cualquier `sk_*` | ❌ NUNCA en `.env` del frontend | Vite expone `VITE_*` al navegador |
| Cualquier `sk_*` | ❌ NUNCA en Firestore | Aunque la colección esté protegida, viajaría al navegador del admin |

### Configuración

1. **Frontend**: rellena la publishable key desde `/admin/payment-settings`.
2. **Backend**: instala y despliega las Cloud Functions:

   ```bash
   cd functions
   npm install
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions
   ```

3. **Stripe Dashboard**: configura el webhook apuntando a tu Cloud Function.
   Mira `functions/README.md` para instrucciones detalladas.

### Flujo de checkout

1. Cliente rellena pedido → se crea documento en `orders/`
2. Frontend invoca `createCheckoutSession({ orderId, amount, currency, ... })`
3. Cloud Function crea Stripe Checkout Session y devuelve `{ url, sessionId }`
4. Frontend redirige a `url` (Stripe Checkout)
5. Cliente paga → Stripe envía webhook a `stripeWebhook`
6. Cloud Function actualiza `paymentStatus: 'paid'` en el pedido

---

## 🛣️ Roadmap sugerido

- [x] Firebase Auth para proteger `/admin`
- [x] Pasarela de pago (Stripe) con Cloud Functions
- [ ] Notificaciones por email/WhatsApp al crear pedido
- [ ] Dashboard con gráficas de ingresos
- [ ] Multi-idioma (i18n)
- [ ] PWA con notificaciones push
- [ ] Integración con Google Maps para estimar tiempo de recogida
- [ ] Custom claims para roles admin/cliente
- [ ] Soporte completo de Mercado Pago (Preference + Webhook)

---

## 📜 Licencia

MIT © 2025 — potaje1984

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
| **Login (`/login`)** | Inicio de sesión email + password con `signInWithEmailAndPassword`. |
| **ProtectedRoute** | Componente que envuelve rutas privadas; redirige a `/login` si no hay sesión. |
| **Firebase Firestore** | Persistencia en tiempo real con estructura normalizada de pedidos. |
| **Firebase Auth** | Email/Password. Sesión persistente (localStorage). |
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

## 🛣️ Roadmap sugerido

- [ ] Firebase Auth para proteger `/admin`
- [ ] Notificaciones por email/WhatsApp al crear pedido
- [ ] Pasarela de pago (Stripe / PayPal)
- [ ] Dashboard con gráficas de ingresos
- [ ] Multi-idioma (i18n)
- [ ] PWA con notificaciones push
- [ ] Integración con Google Maps para estimar tiempo de recogida

---

## 📜 Licencia

MIT © 2025 — potaje1984

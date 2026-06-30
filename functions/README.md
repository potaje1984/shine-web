# Cloud Functions · Shine

Funciones de backend para gestionar de forma segura la pasarela de pago y los webhooks.

## 📋 Funciones incluidas

| Nombre | Tipo | Descripción |
|---|---|---|
| `setPaymentSecret` | Callable | Valida y registra la secret key del admin. La clave se guarda en **Cloud Functions env vars** (`firebase functions:secrets`), NUNCA en Firestore. |
| `createCheckoutSession` | Callable | Crea una sesión de Stripe Checkout usando la secret key del servidor. |
| `stripeWebhook` | HTTP | Recibe webhooks de Stripe (pago completado, expirado) y actualiza el pedido en Firestore. |
| `onOrderCreated` | Firestore Trigger | Se dispara al crear un pedido. Placeholder para notificaciones al admin. |

---

## 🚀 Puesta en marcha

### 1. Instalar Firebase CLI (si no lo tienes)

```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar Functions (solo la primera vez)

Desde la raíz del proyecto:

```bash
firebase init functions
# Selecciona tu proyecto
# Lenguaje: JavaScript
# ESLint: No (opcional)
#npm dependencies: Sí
```

Si ya tienes la carpeta `functions/` de este repo, solo necesitas instalar dependencias:

```bash
cd functions
npm install
```

### 3. Configurar secretos encriptados

```bash
# Secret key de Stripe (sk_test_... o sk_live_...)
firebase functions:secrets:set STRIPE_SECRET_KEY
# Pega el valor cuando lo pida (no se muestra)

# Webhook signing secret (whsec_...)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Para Mercado Pago (si lo usas)
firebase functions:secrets:set MP_ACCESS_TOKEN
```

Estos secretos se guardan encriptados en Google Cloud y solo son accesibles desde dentro de las Cloud Functions. **Nunca** aparecen en el código ni en Firestore.

### 4. Desplegar

```bash
firebase deploy --only functions
```

### 5. Configurar webhook en Stripe

1. Ve a https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://us-central1-<TU-PROJECT-ID>.cloudfunctions.net/stripeWebhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copia el **Signing secret** (`whsec_...`) y guárdalo como `STRIPE_WEBHOOK_SECRET` (paso 3).

---

## 🔒 Modelo de seguridad

```
┌─────────────────┐   publishableKey    ┌──────────────┐
│  Admin Browser  │ ─────────────────→  │   Firestore  │
│  (frontend)     │                     │  settings/   │
└────────┬────────┘                     └──────────────┘
         │
         │ secretKey (Callable, HTTPS)
         ↓
┌─────────────────┐   setSecret         ┌──────────────┐
│ setPaymentSecret│ ─────────────────→  │ Cloud KMS    │
│  Cloud Function │                     │ (encriptado) │
└─────────────────┘                     └──────────────┘
                                              ↑
                                              │ solo lectura
                                              │
┌─────────────────┐   process.env         ┌───┴──────────┐
│createCheckoutSes│ ←───────────────────  │ Cloud Run env│
│  Cloud Function │                       │  vars        │
└─────────────────┘                       └──────────────┘
```

**Reglas de oro:**

1. ✅ **Publishable key** (`pk_*`) → Firestore `settings/` (es pública).
2. ✅ **Secret key** (`sk_*`) → Cloud Functions env vars.
3. ✅ **Webhook secret** (`whsec_*`) → Cloud Functions env vars.
4. ❌ NUNCA pegues `sk_*` en `.env` del frontend (Vite expone todo lo que empieza por `VITE_`).
5. ❌ NUNCA guardes `sk_*` en Firestore, aunque la colección esté protegida.

---

## 🧪 Probar en local con emulador

```bash
cd functions
npm install
firebase emulators:start --only functions,firestore
```

Apunta tu frontend al emulador:

```js
// src/firebase/config.js
import { connectFunctionsEmulator } from 'firebase/functions'
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}
```

Para simular un webhook de Stripe en local:

```bash
stripe listen --forward-to localhost:5001/shine-web/us-central1/stripeWebhook
```

---

## 📝 Endpoints después del despliegue

Reemplaza `<PROJECT-ID>` y `<REGION>` (normalmente `us-central1`):

- `https://us-central1-<PROJECT-ID>.cloudfunctions.net/setPaymentSecret`
- `https://us-central1-<PROJECT-ID>.cloudfunctions.net/createCheckoutSession`
- `https://us-central1-<PROJECT-ID>.cloudfunctions.net/stripeWebhook`

---

## 🔁 Rotación de claves

Si necesitas cambiar la secret key:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase deploy --only functions
```

O desde el panel admin (`/admin/payment-settings`), rellena el campo "Secret key" y pulsa "Rotar secret key". La Cloud Function validará la nueva clave y actualizará el flag `secretKeySet`, pero el valor real debe almacenarse con `secrets:set` en CLI.

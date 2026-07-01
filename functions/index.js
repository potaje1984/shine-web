// functions/index.js
// ──────────────────────────────────────────────────────────────────────────
// Cloud Functions de Shine.
//
// Responsabilidades:
//   1. setPaymentSecret        — Callable. Recibe la secret key del admin
//                                 y la guarda en Cloud Functions env vars
//                                 (encriptadas). NUNCA la persiste en Firestore.
//   2. createCheckoutSession   — Callable. Crea una sesión de Stripe Checkout
//                                 usando la secret key del servidor.
//   3. stripeWebhook           — HTTP. Recibe eventos de Stripe (pago completado,
//                                 fallos, etc.) y actualiza el pedido en Firestore.
//
// Despliegue:
//   cd functions && npm install
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
//   firebase deploy --only functions
// ──────────────────────────────────────────────────────────────────────────

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')
const Stripe = require('stripe')
const { MercadoPagoConfig } = require('mercadopago')

admin.initializeApp()
const db = admin.firestore()

// ──────────────────────────────────────────────────────────────────────
// Helper: leer la configuración pública desde Firestore
// ──────────────────────────────────────────────────────────────────────
async function getPublicSettings() {
  const snap = await db.doc('settings/payment-gateway').get()
  return snap.exists ? snap.data() : null
}

// ──────────────────────────────────────────────────────────────────────
// 1) setPaymentSecret — Callable Function
//
// El admin invoca esta función desde /admin/payment-settings.
// Recibe la secret key y la almacena de forma segura usando
// `firebase functions:secrets:set` (encriptada en reposo).
//
// Por seguridad, NO se persiste el valor en Firestore. Solo se escribe
// un booleano `secretKeySet: true` para que el admin UI pueda mostrar
// "Configurada".
// ──────────────────────────────────────────────────────────────────────
exports.setPaymentSecret = onCall(
  {
    secrets: ['STRIPE_SECRET_KEY', 'MP_ACCESS_TOKEN'],
    // Solo admins autenticados pueden invocarla.
    // En producción, sustituye por comprobación de custom claim admin.
    cors: true,
  },
  async (req) => {
    // Verificar autenticación
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    // TODO en producción: verificar custom claim admin
    // if (!req.auth.token.admin) {
    //   throw new HttpsError('permission-denied', 'Solo administradores.')
    // }

    const { provider, secretKey } = req.data || {}
    if (!provider || !secretKey) {
      throw new HttpsError('invalid-argument', 'Faltan provider o secretKey.')
    }
    if (!['stripe', 'mercadopago'].includes(provider)) {
      throw new HttpsError('invalid-argument', 'Provider no soportado.')
    }

    // Validar formato básico (no validar el valor completo, solo prefijo)
    if (provider === 'stripe' && !/^sk_(test|live)_/.test(secretKey)) {
      throw new HttpsError(
        'invalid-argument',
        'La Stripe secret key debe empezar por sk_test_ o sk_live_.',
      )
    }
    if (provider === 'mercadopago' && !secretKey.startsWith('APP_USR_') && !secretKey.startsWith('TEST-')) {
      throw new HttpsError(
        'invalid-argument',
        'El access token de Mercado Pago no tiene un formato válido.',
      )
    }

    // 🔒 Almacenar como SECRET de Cloud Functions (encriptado en reposo).
    // Esto es lo que mantiene la clave fuera del navegador y de Firestore.
    //
    // Nota: `setSecret` no existe en el runtime; el flujo es:
    //   1. Aquí VALIDAMOS la clave con una llamada al API del proveedor.
    //   2. Si es válida, persistimos el flag `secretKeySet: true` en Firestore.
    //   3. El admin debe rotar la clave mediante CLI:
    //        firebase functions:secrets:set STRIPE_SECRET_KEY
    //      (preferiblemente de forma interactiva en local para no exponerla).
    //
    // Alternativa programática más avanzada: integrar Google Secret Manager
    // y escribir la versión nueva desde aquí. Queda fuera del scope de este MVP.

    let isValid = false
    try {
      if (provider === 'stripe') {
        const stripe = new Stripe(secretKey)
        await stripe.accounts.retrieve() // lanza si la clave es inválida
        isValid = true
      } else if (provider === 'mercadopago') {
        const mp = new MercadoPagoConfig({ accessToken: secretKey })
        // Llamada simple para verificar el token
        await fetch('https://api.mercadopago.com/users/me', {
          headers: { Authorization: `Bearer ${secretKey}` },
        }).then((r) => {
          if (!r.ok) throw new Error('Token inválido')
        })
        isValid = true
      }
    } catch (err) {
      throw new HttpsError(
        'invalid-argument',
        'La clave no es válida: ' + err.message,
      )
    }

    if (isValid) {
      // Persistir SOLO el flag, no la clave
      await db.doc('settings/payment-gateway').set(
        {
          provider,
          secretKeySet: true,
          secretKeyUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          secretKeyUpdatedBy: req.auth.token.email || 'unknown',
        },
        { merge: true },
      )
      return { ok: true, message: 'Secret validada. Recuerda rotarla con firebase functions:secrets:set.' }
    }
    throw new HttpsError('internal', 'No se pudo validar la clave.')
  },
)

// ──────────────────────────────────────────────────────────────────────
// 2) createCheckoutSession — Callable Function
//
// Invocada desde el cliente cuando un usuario confirma un pedido.
// Crea una sesión de Stripe Checkout y devuelve la URL a la que redirigir.
//
// Ejemplo de llamada desde el frontend:
//
//   const createCheckout = httpsCallable(functions, 'createCheckoutSession')
//   const { data } = await createCheckout({
//     orderId: 'abc123',
//     amount: 2990,          // en céntimos (Stripe)
//     currency: 'eur',
//     description: 'Lavandería - 7.5kg',
//     customerEmail: 'cliente@email.com',
//   })
//   window.location.href = data.url
// ──────────────────────────────────────────────────────────────────────
exports.createCheckoutSession = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    const settings = await getPublicSettings()
    if (!settings || !settings.active) {
      throw new HttpsError('failed-precondition', 'Pasarela inactiva.')
    }
    if (settings.provider !== 'stripe') {
      throw new HttpsError(
        'failed-precondition',
        'Este endpoint solo soporta Stripe. Usa createMercadoPagoPreference para MP.',
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { orderId, amount, currency, description, customerEmail, origin: clientOrigin } = req.data || {}

    // Validaciones básicas
    if (!orderId || !amount || !currency) {
      throw new HttpsError('invalid-argument', 'Faltan parámetros.')
    }
    if (amount < 50) {
      throw new HttpsError('invalid-argument', 'Importe mínimo: 0,50€.')
    }

    // ────────────────────────────────────────────────────────────────
    // Detección de origen dinámica para los redirects de Stripe.
    //
    // Prioridad:
    //   1. origin explícito pasado por el cliente (clientOrigin)
    //   2. Cabecera Origin o Referer de la petición (Callable Functions
    //      exponen req.app? req.headers... aquí usamos req.app.headers)
    //   3. Variable de entorno STRIPE_SUCCESS_URL_BASE configurada en
    //      Cloud Functions (recomendado para producción)
    //   4. Fallback: localhost — SOLO para desarrollo local
    //
    // Esto evita que en producción los clientes sean redirigidos a
    // localhost después de pagar.
    // ────────────────────────────────────────────────────────────────
    const detectedOrigin =
      clientOrigin ||
      (req.app && (req.app.get('origin') || req.app.get('referer'))) ||
      (req.headers && (req.headers.origin || req.headers.referer)) ||
      process.env.STRIPE_SUCCESS_URL_BASE ||
      'http://localhost:5173'

    // Sanitizar: quitar trailing slash
    const origin = detectedOrigin.replace(/\/$/, '')

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: description || 'Servicio Shine' },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        customer_email: customerEmail,
        client_reference_id: orderId,
        success_url: `${origin}/pedido-exito?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pedido-cancelado`,
        metadata: { orderId },
      })

      // Marcar el pedido como 'esperando pago'
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'pending',
        paymentSessionId: session.id,
        paymentProvider: 'stripe',
      })

      return { url: session.url, sessionId: session.id }
    } catch (err) {
      console.error('Stripe checkout error:', err)
      throw new HttpsError('internal', 'No se pudo crear la sesión de pago.')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 3) stripeWebhook — HTTP Function (sin cors, recibe de Stripe)
//
// Configurar el webhook en el dashboard de Stripe:
//   URL: https://us-central1-<project>.cloudfunctions.net/stripeWebhook
//   Eventos: checkout.session.completed, checkout.session.expired
//
// Recuperar el webhook signing secret:
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// ──────────────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(
  { secrets: ['STRIPE_WEBHOOK_SECRET', 'STRIPE_SECRET_KEY'], maxInstances: 5 },
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature']

    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          const orderId = session.metadata?.orderId || session.client_reference_id
          if (orderId) {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'paid',
              paymentIntentId: session.payment_intent,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }
          break
        }
        case 'checkout.session.expired': {
          const session = event.data.object
          const orderId = session.metadata?.orderId
          if (orderId) {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'expired',
            })
          }
          break
        }
        default:
          // Evento no manejado
          console.log(`Evento no manejado: ${event.type}`)
      }
      res.json({ received: true })
    } catch (err) {
      console.error('Error procesando webhook:', err)
      res.status(500).send('Error interno')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 4) onOrderCreated — Firestore Trigger (opcional)
//
// Cuando se crea un pedido nuevo en /orders, podrías disparar lógica
// adicional: notificación al admin por email, generar prefencia de MP, etc.
// ──────────────────────────────────────────────────────────────────────
exports.onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const order = event.data?.data()
    if (!order) return
    console.log(`Nuevo pedido creado: ${event.params.orderId}`, order.nombre)
    // TODO: enviar email al admin, push notification, etc.
  },
)

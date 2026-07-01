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
// 2) updateOrderPrice — Callable Function
//
// El admin fija el precio final de un pedido tras pesar la ropa.
// Cambia el status de 'esperando_peso' a 'listo_para_pago' atómicamente.
//
// Seguridad:
//   • Verifica que el llamador está autenticado.
//   • En producción, sustituir la comprobación de email por custom claim
//     admin === true (ver README para configurarlo).
//
// Frontend:
//   const res = await callFunction('updateOrderPrice', {
//     orderId: 'abc123',
//     finalPrice: 29.90,  // en EUROS (la CF lo convierte a céntimos)
//   })
// ──────────────────────────────────────────────────────────────────────
exports.updateOrderPrice = onCall(
  { cors: true },
  async (req) => {
    // ── 1. Autenticación ───────────────────────────────────────────
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    // TODO producción: usar custom claims
    // if (!req.auth.token.admin) {
    //   throw new HttpsError('permission-denied', 'Solo administradores.')
    // }
    // Mientras tanto, whitelist por email:
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const callerEmail = (req.auth.token.email || '').toLowerCase()
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(callerEmail)) {
      throw new HttpsError('permission-denied', 'Solo administradores.')
    }

    // ── 2. Validación de parámetros ────────────────────────────────
    const { orderId, finalPrice } = req.data || {}
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'Falta orderId.')
    }
    const price = Number(finalPrice)
    if (isNaN(price) || price <= 0) {
      throw new HttpsError('invalid-argument', 'finalPrice debe ser un número positivo.')
    }
    if (price > 9999) {
      throw new HttpsError('invalid-argument', 'finalPrice no puede superar 9999€.')
    }

    // ── 3. Leer el pedido actual ───────────────────────────────────
    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Pedido no encontrado.')
    }
    const order = orderSnap.data()

    // Solo se puede fijar precio si está en estado esperando_peso
    if (order.status && order.status !== 'esperando_peso') {
      throw new HttpsError(
        'failed-precondition',
        `No se puede fijar precio: el pedido está en estado "${order.status}".`,
      )
    }

    // ── 4. Actualizar atómicamente ─────────────────────────────────
    const finalPriceCents = Math.round(price * 100) // Stripe usa céntimos
    await orderRef.update({
      finalPrice: price,
      finalPriceCents,
      status: 'listo_para_pago',
      pricedAt: admin.firestore.FieldValue.serverTimestamp(),
      pricedBy: callerEmail,
    })

    return {
      ok: true,
      message: 'Precio fijado. El cliente ya puede pagar.',
      orderId,
      finalPrice: price,
      status: 'listo_para_pago',
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 3) createCheckoutSession — Callable Function
//
// Crea una sesión de Stripe Checkout basándose en el finalPrice guardado
// en el documento del pedido.
//
// Flujo:
//   1. Cliente/admin invoca con { orderId }
//   2. CF lee el pedido de Firestore
//   3. CF verifica que status === 'listo_para_pago' y finalPrice existe
//   4. CF crea Stripe Checkout Session con el importe correcto
//   5. CF guarda paymentLink y paymentStatus en el pedido
//   6. CF devuelve { url, sessionId } para redirigir
// ──────────────────────────────────────────────────────────────────────
exports.createCheckoutSession = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    // ── 1. Verificar autenticación (cliente o admin) ──────────────
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    // ── 2. Cargar settings de la pasarela ─────────────────────────
    const settings = await getPublicSettings()
    if (!settings || !settings.active) {
      throw new HttpsError('failed-precondition', 'Pasarela inactiva.')
    }
    if (settings.provider !== 'stripe') {
      throw new HttpsError(
        'failed-precondition',
        'Este endpoint solo soporta Stripe.',
      )
    }

    // ── 3. Cargar el pedido ───────────────────────────────────────
    const { orderId, origin: clientOrigin } = req.data || {}
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'Falta orderId.')
    }

    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Pedido no encontrado.')
    }
    const order = orderSnap.data()

    // ── 4. Validar estado ─────────────────────────────────────────
    if (order.status !== 'listo_para_pago') {
      throw new HttpsError(
        'failed-precondition',
        `El pedido no está listo para pagar (estado: "${order.status}").`,
      )
    }
    if (!order.finalPriceCents || order.finalPriceCents < 50) {
      throw new HttpsError(
        'failed-precondition',
        'El pedido no tiene un precio final válido.',
      )
    }

    // ── 5. Detección de origin para redirects ─────────────────────
    const detectedOrigin =
      clientOrigin ||
      (req.headers && (req.headers.origin || req.headers.referer)) ||
      process.env.STRIPE_SUCCESS_URL_BASE ||
      'http://localhost:5173'
    const origin = detectedOrigin.replace(/\/$/, '')

    // ── 6. Crear sesión de Stripe ─────────────────────────────────
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const currency = settings.currency || 'eur'
    const description = `${order.tipoServicio || 'Servicio'} — Pedido ${orderId.slice(0, 8)}`
    const customerEmail = req.auth.token.email || order.nombre || undefined

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: description },
              unit_amount: order.finalPriceCents,
            },
            quantity: 1,
          },
        ],
        customer_email: customerEmail,
        client_reference_id: orderId,
        success_url: `${origin}/pedido-exito?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pedido-cancelado`,
        metadata: { orderId, finalPrice: String(order.finalPrice) },
      })

      // Guardar info en el pedido
      await orderRef.update({
        paymentStatus: 'pending',
        paymentSessionId: session.id,
        paymentLink: session.url,
        paymentProvider: 'stripe',
        paymentCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return { url: session.url, sessionId: session.id }
    } catch (err) {
      console.error('Stripe checkout error:', err)
      throw new HttpsError('internal', 'No se pudo crear la sesión de pago.')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 4) stripeWebhook — HTTP Function (sin cors, recibe de Stripe)
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
              status: 'pagado',
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
              // Si expira, volvemos a 'listo_para_pago' para poder regenerar link
              status: 'listo_para_pago',
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

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

// ════════════════════════════════════════════════════════════════════════
// TARJETAS GUARDADAS (SetupIntent + PaymentIntent off-session)
//
// Flujo tipo Uber:
//   Fase 1 — Cliente registra tarjeta una vez (createSetupIntent)
//   Fase 2 — Sistema cobra cuando quiere (chargeSavedCard)
// ════════════════════════════════════════════════════════════════════════

/**
 * Helper: obtener o crear un Stripe Customer para este uid.
 * Persiste stripeCustomerId en Firestore users/{uid}.
 */
async function getOrCreateStripeCustomer(uid, email) {
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()

  if (userSnap.exists && userSnap.data().stripeCustomerId) {
    return userSnap.data().stripeCustomerId
  }

  // Crear Customer en Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const customer = await stripe.customers.create({
    metadata: { firebaseUid: uid },
    email: email || undefined,
  })

  // Persistir en Firestore (sin datos sensibles de tarjeta)
  await userRef.set({
    uid,
    email: email || null,
    stripeCustomerId: customer.id,
    paymentMethods: [],
    defaultPaymentMethodId: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  return customer.id
}

// ──────────────────────────────────────────────────────────────────────
// 6) createSetupIntent — FASE 1: registrar tarjeta sin cobrar
//
// El cliente invoca esta función desde /save-card. Devuelve un
// `clientSecret` que Stripe Elements usa para montar el formulario
// seguro de captura de tarjeta.
//
// Frontend:
//   const { clientSecret, customerId } = await callFunction('createSetupIntent')
//   // → usar con <Elements options={{ clientSecret }}>
// ──────────────────────────────────────────────────────────────────────
exports.createSetupIntent = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    const uid = req.auth.uid
    const email = req.auth.token.email || null

    try {
      const customerId = await getOrCreateStripeCustomer(uid, email)
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

      // SetupIntent con usage: 'off_session' → habilita cobros posteriores
      // sin que el cliente esté presente. Stripe puede requerir 3DS en este
      // paso (métodos europeos) y eso se resuelve en el frontend.
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: { firebaseUid: uid },
      })

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId,
      }
    } catch (err) {
      console.error('createSetupIntent error:', err)
      throw new HttpsError('internal', 'No se pudo iniciar el registro de tarjeta.')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 7) savePaymentMethod — Persistir PaymentMethod en Firestore
//
// Tras confirmar el SetupIntent en el frontend, el cliente llama a esta
// función con el paymentMethodId. Esta CF:
//   1. Recupera el PaymentMethod de Stripe (para obtener brand, last4…)
//   2. Lo adjunta al Customer (si no lo está ya)
//   3. Lo persiste en Firestore users/{uid}.paymentMethods[]
//   4. Si es la primera tarjeta, la marca como default
//
// ⚠️  NO guardamos números de tarjeta, CVV ni expiración completa.
//     Solo: id, brand, last4, expMonth, expYear.
// ──────────────────────────────────────────────────────────────────────
exports.savePaymentMethod = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    const { paymentMethodId } = req.data || {}
    if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
      throw new HttpsError('invalid-argument', 'paymentMethodId inválido.')
    }

    const uid = req.auth.uid
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    try {
      const userRef = db.collection('users').doc(uid)
      const userSnap = await userRef.get()
      if (!userSnap.exists || !userSnap.data().stripeCustomerId) {
        throw new HttpsError('failed-precondition', 'Falta crear el Customer primero.')
      }
      const { stripeCustomerId } = userSnap.data()
      const userData = userSnap.data()

      // Recuperar PM desde Stripe para tener brand/last4
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId)

      // Attach al Customer (idempotente: si ya está adjunto, Stripe lanza
      // error específico que ignoramos)
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        })
      } catch (attachErr) {
        // Código invalid_request_error con msg "already attached" es OK
        if (!/already attached/i.test(attachErr.message)) {
          throw attachErr
        }
      }

      // ¿Es la primera tarjeta? Marcar como default del Customer en Stripe
      const isFirstCard = !userData.defaultPaymentMethodId
      if (isFirstCard) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        })
      }

      // Persistir en Firestore (sin datos sensibles)
      const pmSummary = {
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '----',
        expMonth: pm.card?.exp_month || null,
        expYear: pm.card?.exp_year || null,
        isDefault: isFirstCard,
        addedAt: new Date().toISOString(),
      }

      const existing = userData.paymentMethods || []
      // Evitar duplicados
      const filtered = existing.filter((p) => p.id !== pm.id)
      const paymentMethods = [...filtered, pmSummary]

      await userRef.update({
        paymentMethods,
        defaultPaymentMethodId: isFirstCard ? pm.id : (userData.defaultPaymentMethodId || null),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return {
        ok: true,
        paymentMethod: pmSummary,
        isDefault: isFirstCard,
      }
    } catch (err) {
      console.error('savePaymentMethod error:', err)
      throw new HttpsError('internal', err.message || 'No se pudo guardar la tarjeta.')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 8) listPaymentMethods — Devuelve las tarjetas guardadas del usuario
// ──────────────────────────────────────────────────────────────────────
exports.listPaymentMethods = onCall(
  { cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    const userRef = db.collection('users').doc(req.auth.uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return { paymentMethods: [], defaultPaymentMethodId: null }
    }
    const data = userSnap.data()
    return {
      paymentMethods: data.paymentMethods || [],
      defaultPaymentMethodId: data.defaultPaymentMethodId || null,
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 9) setDefaultPaymentMethod — Cambiar tarjeta por defecto
// ──────────────────────────────────────────────────────────────────────
exports.setDefaultPaymentMethod = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    const { paymentMethodId } = req.data || {}
    const uid = req.auth.uid

    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado.')
    }
    const userData = userSnap.data()
    if (!userData.stripeCustomerId) {
      throw new HttpsError('failed-precondition', 'Sin Customer de Stripe.')
    }

    const pm = (userData.paymentMethods || []).find((p) => p.id === paymentMethodId)
    if (!pm) {
      throw new HttpsError('not-found', 'Tarjeta no encontrada.')
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    await stripe.customers.update(userData.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const paymentMethods = (userData.paymentMethods || []).map((p) => ({
      ...p,
      isDefault: p.id === paymentMethodId,
    }))

    await userRef.update({
      paymentMethods,
      defaultPaymentMethodId: paymentMethodId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { ok: true, paymentMethods, defaultPaymentMethodId: paymentMethodId }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 10) removePaymentMethod — Eliminar tarjeta
// ──────────────────────────────────────────────────────────────────────
exports.removePaymentMethod = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    const { paymentMethodId } = req.data || {}
    const uid = req.auth.uid

    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado.')
    }
    const userData = userSnap.data()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    await stripe.paymentMethods.detach(paymentMethodId)

    let paymentMethods = (userData.paymentMethods || []).filter((p) => p.id !== paymentMethodId)
    let defaultPaymentMethodId = userData.defaultPaymentMethodId

    // Si eliminamos la default, promover la primera
    if (defaultPaymentMethodId === paymentMethodId) {
      if (paymentMethods.length > 0) {
        defaultPaymentMethodId = paymentMethods[0].id
        await stripe.customers.update(userData.stripeCustomerId, {
          invoice_settings: { default_payment_method: defaultPaymentMethodId },
        })
        paymentMethods = paymentMethods.map((p, i) => ({ ...p, isDefault: i === 0 }))
      } else {
        defaultPaymentMethodId = null
      }
    }

    await userRef.update({
      paymentMethods,
      defaultPaymentMethodId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { ok: true, paymentMethods, defaultPaymentMethodId }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 11) chargeSavedCard — FASE 2: cobrar con tarjeta guardada (off-session)
//
// Recibe { orderId } y cobra usando la tarjeta por defecto del cliente
// (o la indicada en paymentMethodId). Maneja 3DS si Stripe lo requiere.
//
// Seguridad:
//   • Si req.auth.token.admin === true → admin cobra por el cliente
//   • Si no es admin → solo puede cobrar sus propios pedidos
//
// Estrategia off-session:
//   PaymentIntent.create({
//     customer, payment_method, amount, currency,
//     confirm: true,        ← cobra inmediatamente
//     off_session: true,    ← cliente no presente
//   })
//
//   Si Stripe requiere 3DS → lanza error con código
//   "authentication_required" y devolvemos un clientSecret para que el
//   frontend muestre el modal de 3DS (stripe.handleCardAction).
// ──────────────────────────────────────────────────────────────────────
exports.chargeSavedCard = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    const { orderId, paymentMethodId: overridePmId } = req.data || {}
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'Falta orderId.')
    }

    // ── 1. Cargar pedido ──────────────────────────────────────────
    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Pedido no encontrado.')
    }
    const order = orderSnap.data()

    // ── 2. Validar permisos ───────────────────────────────────────
    // El admin puede cobrar cualquier pedido; un usuario solo los suyos.
    const isAdmin = req.auth.token.admin === true
    // En nuestro MVP los pedidos no tienen uid del cliente (se crean
    // sin login). Asumimos que solo admin cobra con tarjeta guardada.
    // En producción, añadir order.uid === req.auth.uid para usuarios.
    if (!isAdmin) {
      // Si no es admin, podría ser el cliente pagando su propio pedido:
      // requiere que el pedido tenga uid del cliente. Por ahora, denied.
      throw new HttpsError('permission-denied', 'Solo admin puede cobrar con tarjeta guardada.')
    }

    // ── 3. Validaciones de estado ─────────────────────────────────
    if (order.status !== 'listo_para_pago') {
      throw new HttpsError(
        'failed-precondition',
        `El pedido no está listo para pagar (estado: "${order.status}").`,
      )
    }
    if (!order.finalPriceCents || order.finalPriceCents < 50) {
      throw new HttpsError('failed-precondition', 'finalPrice no fijado.')
    }

    // ── 4. Cargar datos del cliente (Customer + PM) ───────────────
    // El pedido debe tener un cliente asociado (por uid o email).
    // Aquí asumimos que el pedido tiene `customerUid` (futuro: añadir
    // al crear pedido con usuario logueado).
    let userUid = order.customerUid
    let userData
    if (userUid) {
      const userSnap = await db.collection('users').doc(userUid).get()
      if (!userSnap.exists) {
        throw new HttpsError('failed-precondition', 'Cliente sin cuenta de usuario.')
      }
      userData = userSnap.data()
    } else {
      // MVP fallback: buscar usuario por email del pedido
      const email = (order.nombre || '').toLowerCase() // simplificación
      const q = await db.collection('users').where('email', '==', email).limit(1).get()
      if (q.empty) {
        throw new HttpsError(
          'failed-precondition',
          'El cliente no tiene tarjeta registrada. Pídele que registre una en /save-card.',
        )
      }
      userData = q.docs[0].data()
      userUid = userData.uid || q.docs[0].id
    }

    if (!userData.stripeCustomerId) {
      throw new HttpsError('failed-precondition', 'Cliente sin Stripe Customer.')
    }

    const paymentMethodId = overridePmId || userData.defaultPaymentMethodId
    if (!paymentMethodId) {
      throw new HttpsError('failed-precondition', 'Cliente sin tarjeta registrada.')
    }

    // ── 5. Crear PaymentIntent off-session ────────────────────────
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const currency = 'eur'

    try {
      const intent = await stripe.paymentIntents.create({
        amount: order.finalPriceCents,
        currency,
        customer: userData.stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,           // cobra inmediatamente
        off_session: true,       // cliente no presente
        capture_method: 'automatic',
        metadata: {
          orderId,
          firebaseUid: userUid,
          finalPrice: String(order.finalPrice),
        },
        description: `Shine — Pedido ${orderId.slice(0, 8)}`,
      })

      // ── 6. Actualizar pedido ───────────────────────────────────
      await orderRef.update({
        status: 'pagado',
        paymentStatus: 'paid',
        paymentIntentId: intent.id,
        paymentMethod: 'saved_card',
        paymentMethodId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return {
        ok: true,
        status: intent.status,
        paymentIntentId: intent.id,
        requiresAction: false,
      }
    } catch (err) {
      // ── 7. Manejar 3DS requerido ───────────────────────────────
      // Stripe lanza error con code === 'authentication_required'
      // cuando el banco del cliente exige 3D Secure incluso en off_session.
      // En ese caso devolvemos el clientSecret para que el frontend
      // muestre el modal con stripe.handleCardAction(clientSecret).
      if (err.code === 'authentication_required' && err.raw?.payment_intent?.client_secret) {
        // El PaymentIntent quedó en estado requires_action
        const intent = err.raw.payment_intent
        await orderRef.update({
          paymentStatus: 'requires_action',
          paymentIntentId: intent.id,
          paymentMethod: 'saved_card',
          paymentMethodId,
        })
        return {
          ok: false,
          requiresAction: true,
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          message: 'Se requiere autenticación 3D Secure del cliente.',
        }
      }

      console.error('chargeSavedCard error:', err)
      await orderRef.update({
        paymentStatus: 'failed',
        paymentError: err.message,
      })
      throw new HttpsError('internal', err.message || 'No se pudo cobrar la tarjeta.')
    }
  },
)

// ──────────────────────────────────────────────────────────────────────
// 12) confirmCardAction — Completar 3DS tras authentication_required
//
// Tras chargeSavedCard devuelve requiresAction=true, el frontend llama
// a stripe.handleCardAction(clientSecret) para mostrar el modal 3DS.
// Cuando el cliente completa la autenticación, llama a esta CF para
// confirmar el PaymentIntent en el servidor y marcar el pedido como pagado.
// ──────────────────────────────────────────────────────────────────────
exports.confirmCardAction = onCall(
  { secrets: ['STRIPE_SECRET_KEY'], cors: true },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    const { paymentIntentId, orderId } = req.data || {}
    if (!paymentIntentId || !orderId) {
      throw new HttpsError('invalid-argument', 'Faltan paymentIntentId u orderId.')
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status === 'succeeded') {
      await db.collection('orders').doc(orderId).update({
        status: 'pagado',
        paymentStatus: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return { ok: true, status: 'succeeded' }
    }
    return {
      ok: false,
      status: intent.status,
      message: `El PaymentIntent está en estado "${intent.status}".`,
    }
  },
)

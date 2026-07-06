import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/charge
 * Cobra la tarjeta guardada del cliente cuando el admin confirma el peso.
 *
 * El PaymentMethod SIEMPRE viene de un SetupIntent, así que ya tiene un
 * Customer asociado. Recuperamos el PM para obtener ese Customer.
 *
 * Body: { orderId, stripeCustomerId?, stripePaymentMethodId, amount (cents), confirmedWeight }
 */
export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-05-28.basil",
    });

    const body = await request.json();
    const { stripeCustomerId: inputCustomerId, stripePaymentMethodId, amount, orderId, confirmedWeight } = body;

    console.log(`[stripe/charge] START order=${orderId} inputCustomerId=${inputCustomerId} pm=${stripePaymentMethodId} amount=${amount}`);

    if (!stripePaymentMethodId || !amount || !orderId) {
      return NextResponse.json(
        { error: "Missing required fields: stripePaymentMethodId, amount, orderId" },
        { status: 400 }
      );
    }

    // PASO 1: Recuperar SIEMPRE el PaymentMethod para obtener su Customer.
    // El PM viene de SetupIntent → ya está attacheado a un Customer.
    // NUNCA llamamos a paymentMethods.attach() porque ya está hecho.
    console.log(`[stripe/charge] Retrieving PM ${stripePaymentMethodId}...`);
    const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
    const customerId = (pm.customer as string) || inputCustomerId || null;

    console.log(`[stripe/charge] PM.customer=${pm.customer} inputCustomerId=${inputCustomerId} → using customerId=${customerId}`);

    if (!customerId) {
      return NextResponse.json(
        { error: "PaymentMethod has no associated Customer. Create a new order with card." },
        { status: 400 }
      );
    }

    // PASO 2: Crear el PaymentIntent con el Customer correcto
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount),
      currency: "usd",
      customer: customerId,
      payment_method: stripePaymentMethodId,
      confirm: true,
      metadata: {
        orderId,
        confirmedWeight: String(confirmedWeight),
        app: "shine-laundry",
      },
    };

    // Solo agregar return_url si es una URL absoluta válida
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl && baseUrl.startsWith("http")) {
      params.return_url = `${baseUrl}/admin/orders`;
    }

    console.log(`[stripe/charge] Creating PaymentIntent with customer=${customerId} pm=${stripePaymentMethodId} amount=${amount}`);

    // IdempotencyKey previene doble cobro
    const paymentIntent = await stripe.paymentIntents.create(params, {
      idempotencyKey: `charge_${orderId}`,
    });

    console.log(`[stripe/charge] SUCCESS pi=${paymentIntent.id} status=${paymentIntent.status}`);

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      customerId,
    });
  } catch (err: any) {
    console.error("[stripe/charge] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process charge" },
      { status: 500 }
    );
  }
}
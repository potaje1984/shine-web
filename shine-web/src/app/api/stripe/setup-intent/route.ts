import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/setup-intent
 * Crea un Customer + SetupIntent para guardar la tarjeta del cliente SIN cobrar.
 * El cliente confirma con Stripe Elements en el frontend.
 *
 * Body: { email? } — opcional, para asociar al Customer
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

    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    // 1. Crear un Customer en Stripe
    const customer = await stripe.customers.create({
      email: email || undefined,
      metadata: { app: "shine-laundry" },
    });

    // 2. Crear SetupIntent vinculado al Customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        app: "shine-laundry",
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customer.id,
    });
  } catch (err: any) {
    console.error("[stripe/setup-intent] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
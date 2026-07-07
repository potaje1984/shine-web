import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestoreInstance, initFirebase } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { sendReceiptEmail } from "@/lib/email";
import type { OrderDoc, UserDoc } from "@/lib/types";

/**
 * POST /api/stripe/webhook
 * Recibe eventos de Stripe (pagos exitosos, fallidos, etc.)
 * y actualiza el pedido correspondiente en Firestore.
 * También envía recibo por email cuando el pago es exitoso.
 */
export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-05-28.basil",
    });

    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verificar firma del webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[stripe/webhook] Signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Manejar eventos
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await initFirebase();
        const db = getFirestoreInstance();
        if (db) {
          // 1. Actualizar estado del pedido
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            paymentStatus: "paid",
            stripePaymentIntentId: paymentIntent.id,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[stripe/webhook] Order ${orderId} marked as paid`);

          // 2. Enviar recibo por email al cliente
          try {
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
              const orderData = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;

              // Buscar datos del cliente
              const userRef = doc(db, "users", orderData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data() as UserDoc;
                await sendReceiptEmail({
                  order: orderData,
                  customer: {
                    displayName: userData.displayName || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                  },
                });
              } else {
                console.warn(`[stripe/webhook] User ${orderData.userId} not found — no receipt sent.`);
              }
            }
          } catch (emailErr: any) {
            // El email NO debe hacer fallar el webhook
            console.error("[stripe/webhook] Error sending receipt:", emailErr.message);
          }
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await initFirebase();
        const db = getFirestoreInstance();
        if (db) {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            paymentStatus: "failed",
            stripePaymentIntentId: paymentIntent.id,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[stripe/webhook] Order ${orderId} payment failed`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[stripe/webhook] Error:", err);
    return NextResponse.json(
      { error: err.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
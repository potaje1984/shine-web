import { NextResponse } from "next/server";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendReceiptEmail } from "@/lib/email";
import type { OrderDoc, UserDoc } from "@/lib/types";

/**
 * POST /api/send-receipt
 * Envía un recibo por email al cliente de un pedido.
 * Se usa principalmente cuando el admin marca un pago en efectivo.
 * Usa el mismo Firebase Client SDK que el webhook de Stripe.
 *
 * Body: { orderId: string, lang?: "es" | "en" }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, lang = "en" } = body as { orderId: string; lang?: "es" | "en" };

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured. Set RESEND_API_KEY" },
        { status: 503 }
      );
    }

    console.log("[send-receipt] Starting for order:", orderId);

    // Initialize Firebase (same as stripe/webhook)
    await initFirebase();
    const db = getFirestoreInstance();
    if (!db) {
      return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
    }

    // 1. Fetch order (same as stripe/webhook)
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const orderData = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;

    if (!orderData.userId) {
      return NextResponse.json({ error: "Order has no userId" }, { status: 400 });
    }

    console.log("[send-receipt] Order found, userId:", orderData.userId, "total:", orderData.total);

    // 2. Fetch customer (same as stripe/webhook)
    const userRef = doc(db, "users", orderData.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const userData = userSnap.data() as UserDoc;

    if (!userData.email) {
      return NextResponse.json({ error: "Customer has no email" }, { status: 400 });
    }

    console.log("[send-receipt] Customer found:", userData.email);

    // 3. Send receipt (same as stripe/webhook)
    const sent = await sendReceiptEmail({
      order: orderData,
      customer: {
        displayName: userData.displayName || "",
        email: userData.email,
        phone: userData.phone || "",
      },
      lang,
    });

    if (sent) {
      console.log("[send-receipt] SUCCESS - Receipt sent to", userData.email);
      return NextResponse.json({ success: true, message: "Receipt sent to " + userData.email });
    } else {
      console.error("[send-receipt] FAIL - sendReceiptEmail returned false");
      return NextResponse.json({ error: "Failed to send receipt" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[send-receipt] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send receipt" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendReceiptEmail } from "@/lib/email";
import type { OrderDoc, UserDoc } from "@/lib/types";

/**
 * POST /api/send-receipt
 * Envía un recibo por email al cliente de un pedido.
 * Se usa principalmente cuando el admin marca un pago en efectivo.
 *
 * Body: { orderId: string, lang?: "es" | "en" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, lang = "es" } = body as { orderId: string; lang?: "es" | "en" };

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Verificar que hay API key de Resend (no es error fatal si no la hay,
    // pero informamos al admin)
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured. Set RESEND_API_KEY in .env.local" },
        { status: 503 }
      );
    }

    await initFirebase();
    const db = getFirestoreInstance();
    if (!db) {
      return NextResponse.json(
        { error: "Firestore not available" },
        { status: 500 }
      );
    }

    // 1. Obtener el pedido
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    const orderData = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;

    // 2. Obtener datos del cliente
    const userRef = doc(db, "users", orderData.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    const userData = userSnap.data() as UserDoc;
    if (!userData.email) {
      return NextResponse.json(
        { error: "Customer has no email address" },
        { status: 400 }
      );
    }

    // 3. Enviar recibo
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
      return NextResponse.json({ success: true, message: "Receipt sent to " + userData.email });
    } else {
      return NextResponse.json(
        { error: "Failed to send receipt" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[api/send-receipt] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send receipt" },
      { status: 500 }
    );
  }
}
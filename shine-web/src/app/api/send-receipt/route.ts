import { NextResponse } from "next/server";
import { sendReceiptEmail } from "@/lib/email";
import type { OrderDoc, UserDoc } from "@/lib/types";

/**
 * POST /api/send-receipt
 * Envía un recibo por email al cliente de un pedido.
 * Se usa principalmente cuando el admin marca un pago en efectivo.
 * Uses Firebase Admin SDK (via dynamic import) for server-side Firestore access.
 *
 * Body: { orderId: string, lang?: "es" | "en" }
 */

function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\\n/g, "\n");
  if (!key.includes("\n") && key.includes("-----BEGIN")) {
    const header = "-----BEGIN PRIVATE KEY-----\n";
    const footer = "\n-----END PRIVATE KEY-----\n";
    const body = key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").trim();
    const formatted = body.match(/.{1,64}/g)?.join("\n") || body;
    key = header + formatted + footer;
  }
  return key;
}

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

    // Use Firebase Admin for server-side Firestore access
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!clientEmail || !rawKey || !projectId) {
      return NextResponse.json(
        { error: "Firebase Admin not configured" },
        { status: 500 }
      );
    }

    const privateKey = parsePrivateKey(rawKey);
    console.log("[send-receipt] Firebase Admin init:", !!clientEmail, !!projectId, "key length:", privateKey.length);

    const { initializeApp: initApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore: getAdminDb } = await import("firebase-admin/firestore");

    const appConfig: any = { credential: cert({ clientEmail, privateKey, projectId }) };
    let app = getApps().length > 0 ? getApps()[0] : initApp(appConfig);
    const adminDb = getAdminDb(app);

    // 1. Fetch order
    console.log("[send-receipt] Fetching order:", orderId);
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const orderData = { id: orderDoc.id, ...orderDoc.data() } as OrderDoc;

    // 2. Fetch customer
    console.log("[send-receipt] Fetching user:", orderData.userId);
    const userDoc = await adminDb.collection("users").doc(orderData.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const userData = userDoc.data() as UserDoc;
    if (!userData.email) {
      return NextResponse.json({ error: "Customer has no email" }, { status: 400 });
    }

    // 3. Send receipt
    console.log("[send-receipt] Sending receipt to:", userData.email, "lang:", lang);
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
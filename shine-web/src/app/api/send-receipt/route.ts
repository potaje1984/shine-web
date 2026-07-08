import { NextResponse } from "next/server";
import { sendReceiptEmail } from "@/lib/email";
import type { OrderDoc, UserDoc } from "@/lib/types";

/**
 * POST /api/send-receipt
 * Envia un recibo por email al cliente de un pedido.
 * Se usa principalmente cuando el admin marca un pago en efectivo.
 *
 * Usa google-auth-library + Firestore REST API (NO firebase-admin)
 * para evitar problemas de ESM/CJS en Vercel.
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
    const body = key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .trim();
    const formatted = body.match(/.{1,64}/g)?.join("\n") || body;
    key = header + formatted + footer;
  }
  return key;
}

// ─── Token cache (same pattern as reset-password) ───
let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.token;
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !rawKey || !projectId) {
    throw new Error(
      `Missing env vars: ${[
        !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
        !rawKey && "FIREBASE_ADMIN_PRIVATE_KEY",
        !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }

  const privateKey = parsePrivateKey(rawKey);

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/datastore", "https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse.token) {
    throw new Error("Failed to obtain access token");
  }

  _cachedToken = {
    token: tokenResponse.token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };

  return tokenResponse.token;
}

// ─── Firestore REST API helpers ───

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number | null;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

function firestoreToJs(value: FirestoreValue | undefined | null): any {
  if (!value) return null;

  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined && value.doubleValue !== null) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.geoPointValue) return value.geoPointValue;

  if (value.mapValue?.fields) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) {
      obj[k] = firestoreToJs(v);
    }
    return obj;
  }

  if (value.arrayValue?.values) {
    return value.arrayValue.values.map((v) => firestoreToJs(v));
  }

  return null;
}

async function fetchFirestoreDoc(collection: string, docId: string): Promise<Record<string, any> | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const accessToken = await getAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  console.log(`[send-receipt] Fetching ${collection}/${docId} via REST API`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`[send-receipt] Firestore REST error ${response.status}: ${errText}`);
    return null;
  }

  const data = await response.json();

  if (!data.fields) {
    console.warn(`[send-receipt] Document ${collection}/${docId} has no fields`);
    return null;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data.fields)) {
    result[key] = firestoreToJs(value as FirestoreValue);
  }

  return result;
}

// ─── Main handler ───

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

    // 1. Fetch order via Firestore REST API
    const orderRaw = await fetchFirestoreDoc("orders", orderId);
    if (!orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = { id: orderId, ...orderRaw } as unknown as OrderDoc;
    console.log("[send-receipt] Order found, userId:", orderData.userId, "total:", orderData.total);

    // 2. Fetch customer via Firestore REST API
    if (!orderData.userId) {
      return NextResponse.json({ error: "Order has no userId" }, { status: 400 });
    }

    const userRaw = await fetchFirestoreDoc("users", orderData.userId);
    if (!userRaw) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const userData = userRaw as unknown as UserDoc;
    if (!userData.email) {
      return NextResponse.json({ error: "Customer has no email" }, { status: 400 });
    }

    console.log("[send-receipt] Customer found:", userData.email);

    // 3. Send receipt via Resend
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
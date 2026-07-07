import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/confirm-delivery
 *
 * Validates that the admin is near the delivery address (within ~200 meters),
 * uploads the delivery photo to Firebase Storage, updates the order to "delivered",
 * and sends the customer a delivery confirmation email with the photo.
 *
 * Body (multipart/form-data):
 *   - orderId: string
 *   - photo: File (image)
 *   - lat: number (admin's current latitude)
 *   - lng: number (admin's current longitude)
 */

const DELIVERY_RADIUS_METERS = 200;

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function geocodeAddress(address: { street: string; city: string; zip: string }): Promise<{ lat: number; lng: number } | null> {
  const fullAddress = `${address.street}, ${address.city} ${address.zip}`;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.warn("[confirm-delivery] No Google Maps API key, skipping location check");
    return Promise.resolve(null);
  }

  return fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      return null;
    })
    .catch(() => null);
}

function buildDeliveryEmailHtml(
  customerName: string,
  orderNumber: string,
  serviceType: string,
  photoUrl: string,
  address: string
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Delivered — Shine</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .wrapper { max-width: 480px; margin: 0 auto; padding: 24px 16px; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .header {
      text-align: center;
      padding: 32px 24px 20px;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    }
    .header h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .header p { font-size: 12px; color: rgba(255,255,255,0.8); }
    .body { padding: 32px 24px; text-align: center; }
    .body h2 { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px; }
    .body p { font-size: 14px; color: #555; margin-bottom: 24px; line-height: 1.7; }
    .photo-container {
      margin: 0 auto 24px;
      max-width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #f3f4f6;
    }
    .photo-container img {
      width: 100%;
      height: auto;
      display: block;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #9ca3af; }
    .info-value { color: #111; font-weight: 600; }
    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #ecfdf5;
      color: #059669;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .footer {
      text-align: center;
      padding: 20px 24px;
      border-top: 1px solid #f3f4f6;
    }
    .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>✨ Shine</h1>
        <p>Professional Laundry & Cleaning Services</p>
      </div>
      <div class="body">
        <div class="success-badge">&#10003; Delivered</div>
        <h2>Your Order Has Been Delivered!</h2>
        <p>Hi <strong>${customerName}</strong>, your ${serviceType} order has been successfully delivered. Here is the delivery confirmation photo:</p>
        <div class="photo-container">
          <img src="${photoUrl}" alt="Delivery confirmation" />
        </div>
        <div style="background:#f9fafb; border-radius:12px; padding:16px; margin-bottom:24px;">
          <div class="info-row">
            <span class="info-label">Order</span>
            <span class="info-value">${orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Delivered to</span>
            <span class="info-value">${address}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
        <p>Thank you for choosing Shine! We hope to serve you again soon.</p>
      </div>
      <div class="footer">
        <p>Shine — Professional Laundry & Cleaning Services</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

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
    const formData = await request.formData();
    const orderId = formData.get("orderId") as string;
    const photo = formData.get("photo") as File | null;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);

    if (!orderId || !photo || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, photo, lat, lng" },
        { status: 400 }
      );
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Photo must be an image" }, { status: 400 });
    }

    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be under 10MB" }, { status: 400 });
    }

    // Initialize Firebase Admin (using google-auth-library approach)
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!clientEmail || !rawKey || !projectId) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    const privateKey = parsePrivateKey(rawKey);

    const { initializeApp: initApp, getApps, cert } = await import("firebase-admin/app");
    const { getStorage } = await import("firebase-admin/storage");
    const { getFirestore: getAdminDb } = await import("firebase-admin/firestore");

    let app = getApps().length > 0 ? getApps()[0] : initApp({ credential: cert({ clientEmail, privateKey, projectId }) });
    const storage = getStorage(app);
    const adminDb = getAdminDb(app);

    // Fetch order
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data();
    const orderAddress = order.address;

    // Validate location if address exists
    if (orderAddress?.street) {
      const coords = await geocodeAddress(orderAddress);
      if (coords) {
        const distance = haversineDistance(lat, lng, coords.lat, coords.lng);
        if (distance > DELIVERY_RADIUS_METERS) {
          const distanceFeet = Math.round(distance * 3.28084);
          return NextResponse.json({
            error: "LOCATION_MISMATCH",
            message: `You are approximately ${distanceFeet} feet away from the delivery address. Please go to the correct location to confirm delivery.`,
            distance: Math.round(distance),
            maxDistance: DELIVERY_RADIUS_METERS,
            targetAddress: `${orderAddress.street}, ${orderAddress.city} ${orderAddress.zip}`,
          }, { status: 403 });
        }
      }
    }

    // Upload photo to Firebase Storage
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoExt = photo.name.split(".").pop() || "jpg";
    const photoPath = `deliveries/${orderId}/${Date.now()}.${photoExt}`;
    const bucket = storage.bucket();
    const file = bucket.file(photoPath);

    await file.save(photoBuffer, {
      metadata: {
        contentType: photo.type,
        cacheControl: "public, max-age=31536000",
      },
    });
    await file.makePublic();

    const photoUrl = file.publicUrl();

    // Update order
    await adminDb.collection("orders").doc(orderId).update({
      status: "delivered",
      deliveryDate: new Date().toISOString(),
      deliveryPhotoUrl: photoUrl,
      updatedAt: new Date().toISOString(),
    });

    // Send delivery email
    let emailSent = false;
    try {
      let customerEmail = "";
      let customerName = "Customer";
      try {
        const userDoc = await adminDb.collection("users").doc(order.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          customerEmail = userData.email || "";
          customerName = userData.displayName || userData.email?.split("@")[0] || "Customer";
        }
      } catch { /* ignore */ }

      if (customerEmail && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Shine <onboarding@resend.dev>";

        const serviceLabels: Record<string, string> = {
          wash_fold: "Wash & Fold",
          dry_clean: "Dry Clean",
          house_cleaning: "House Cleaning",
        };
        const serviceLabel = serviceLabels[order.serviceType] || order.serviceType;
        const deliveryAddress = orderAddress
          ? `${orderAddress.street}, ${orderAddress.city} ${orderAddress.zip}`
          : "N/A";

        await resend.emails.send({
          from: fromEmail,
          to: [customerEmail],
          subject: `Order ${orderId.slice(-6).toUpperCase()} Delivered — Shine`,
          html: buildDeliveryEmailHtml(
            customerName,
            orderId.slice(-6).toUpperCase(),
            serviceLabel,
            photoUrl,
            deliveryAddress
          ),
        });
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("[confirm-delivery] Email failed:", emailErr);
    }

    // Create notification
    try {
      await adminDb.collection("notifications").add({
        userId: order.userId,
        type: "order_status",
        title: "Order Delivered!",
        body: "Your order has been successfully delivered. Check the delivery confirmation photo in the app.",
        orderId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      photoUrl,
      emailSent,
      message: "Delivery confirmed successfully",
    });
  } catch (err: any) {
    console.error("[confirm-delivery] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to confirm delivery" },
      { status: 500 }
    );
  }
}
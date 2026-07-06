import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/reset-password
 *
 * Strategy:
 * 1. Try Firebase Admin + Resend → branded Shine email
 * 2. If Firebase Admin fails → return {fallback:true} so frontend
 *    uses Firebase Client SDK (which now sends via Resend SMTP)
 *
 * Body: { email: string }
 */

let _adminAuth: import("firebase-admin/auth").Auth | null = null;
let _initError: string | null = null;

function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Remove surrounding quotes (single or double) if present
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Replace literal \n with actual newlines (handles env var escaping)
  key = key.replace(/\\n/g, "\n");

  // If still no newlines but has the PEM header, insert newlines after each line
  // (some env systems mangle PEM into a single line)
  if (!key.includes("\n") && key.includes("-----BEGIN")) {
    // PEM lines are typically 64 chars wide
    const header = key.substring(0, key.indexOf("-----END"));
    const footer = key.substring(key.indexOf("-----END"));
    const body = header.replace("-----BEGIN PRIVATE KEY-----", "").trim();
    const formatted = body.match(/.{1,64}/g)?.join("\n") || body;
    key = "-----BEGIN PRIVATE KEY-----\n" + formatted + "\n" + footer + "\n";
  }

  return key;
}

async function getAdminAuth() {
  if (_initError) throw new Error(_initError);
  if (_adminAuth) return _adminAuth;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !rawKey || !projectId) {
    const missing = [];
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!rawKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
    if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    _initError = `Missing env vars: ${missing.join(", ")}`;
    throw new Error(_initError);
  }

  const privateKey = parsePrivateKey(rawKey);

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    const credential = cert({ clientEmail, privateKey, projectId });

    const app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({ credential });

    _adminAuth = getAuth(app);
    return _adminAuth;
  } catch (err: any) {
    _initError = err.message;
    throw err;
  }
}

function buildResetHtml(resetLink: string, displayName: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password — Shine</title>
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
    .body .name { font-weight: 600; color: #333; }
    .btn {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
    }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 24px 0; }
    .note { font-size: 12px; color: #999; line-height: 1.7; }
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
        <h2>Reset Your Password</h2>
        <p>Hi <span class="name">${displayName}</span>, we received a request to reset your password. Click the button below to choose a new one.</p>
        <a href="${resetLink}" class="btn">Reset Password</a>
        <div class="divider"></div>
        <p class="note">
          If you didn't request this, you can safely ignore this email.<br />
          This link will expire in 1 hour for security.
        </p>
      </div>
      <div class="footer">
        <p>Shine — Professional Laundry & Cleaning Services</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ fallback: true, reason: "RESEND_API_KEY not set" });
    }

    // 1. Try Firebase Admin approach (branded email via Resend)
    try {
      const auth = await getAdminAuth();

      // Get user display name
      let displayName = "there";
      try {
        const userRecord = await auth.getUserByEmail(email);
        displayName = userRecord.displayName || userRecord.email?.split("@")[0] || "there";
      } catch {
        // User may not exist
      }

      // Generate reset link (does NOT send email)
      const { generatePasswordResetLink } = await import("firebase-admin/auth");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shinecleann.com";
      const resetLink = await generatePasswordResetLink(auth, email, { url: baseUrl });

      // Send branded email via Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Shine <onboarding@resend.dev>";

      await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: "Reset your password — Shine",
        html: buildResetHtml(resetLink, displayName),
      });

      console.log(`[reset-password] Branded email sent to ${email}`);
      return NextResponse.json({ success: true, method: "resend" });

    } catch (adminErr: any) {
      // Firebase Admin failed — tell frontend to use fallback
      console.error("[reset-password] Admin failed, using fallback:", adminErr.message);
      return NextResponse.json({ fallback: true, reason: adminErr.message });
    }

  } catch (err: any) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send reset email" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reset-password?debug=1
 * Debug endpoint to check if Firebase Admin env vars are configured correctly.
 * Remove this endpoint in production after debugging.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("debug") !== "1") {
    return NextResponse.json({ error: "Use ?debug=1" }, { status: 400 });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const resendKey = process.env.RESEND_API_KEY;

  const keyPreview = rawKey
    ? `${rawKey.trim().substring(0, 30)}...${rawKey.trim().slice(-20)}`
    : "NOT SET";

  const hasQuotes = rawKey
    ? (rawKey.startsWith('"') || rawKey.endsWith('"') || rawKey.startsWith("'") || rawKey.endsWith("'"))
    : false;

  const hasLiteralNewlines = rawKey ? rawKey.includes("\\n") : false;
  const hasRealNewlines = rawKey ? rawKey.includes("\n") : false;

  // Try initializing
  let initResult = "not attempted";
  try {
    const auth = await getAdminAuth();
    initResult = "SUCCESS - Firebase Admin initialized";
  } catch (err: any) {
    initResult = `FAILED: ${err.message}`;
  }

  return NextResponse.json({
    clientEmail: clientEmail ? "SET: " + clientEmail : "NOT SET",
    privateKey: {
      set: !!rawKey,
      length: rawKey?.length || 0,
      preview: keyPreview,
      hasSurroundingQuotes: hasQuotes,
      hasLiteralBackslashN: hasLiteralNewlines,
      hasRealNewlines: hasRealNewlines,
    },
    projectId: projectId ? "SET: " + projectId : "NOT SET",
    resendKey: resendKey ? `SET (ends ...${resendKey.slice(-4)})` : "NOT SET",
    firebaseAdminInit: initResult,
  });
}
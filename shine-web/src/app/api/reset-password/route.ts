import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/reset-password
 *
 * Strategy:
 * 1. Use Google Auth Library + Identity Toolkit REST API to generate reset link
 * 2. Send branded email via Resend
 * 3. Fallback to Firebase Client SDK if env vars missing
 */

function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Remove surrounding quotes
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Replace literal \n with actual newlines
  key = key.replace(/\\n/g, "\n");

  // If single-line PEM, reformat with proper line breaks
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

let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Cache token for 50 minutes (tokens last 60 min)
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

  // Dynamic import to avoid issues at build time
  const { GoogleAuth } = await import("google-auth-library");

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/identitytoolkit"],
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

async function generateResetLink(email: string): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:sendOobCode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        returnOobLink: true,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Identity Toolkit error ${response.status}: ${err?.error?.message || JSON.stringify(err)}`
    );
  }

  const data = await response.json();

  if (!data.oobLink) {
    throw new Error("No oobLink in response");
  }

  return data.oobLink;
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

    // 1. Try Google Auth + Identity Toolkit approach (branded email via Resend)
    try {
      const resetLink = await generateResetLink(email);

      // Use email prefix as display name (we don't have Admin SDK to look up user)
      const displayName = email.split("@")[0] || "there";

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
      // Google Auth failed — tell frontend to use fallback
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
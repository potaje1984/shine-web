/**
 * email.ts
 * Utilidad para enviar emails transaccionales usando Resend.
 * Incluye función para enviar recibos de pago.
 */

import { Resend } from "resend";
import type { OrderDoc, UserDoc, Address } from "@/lib/types";
import { formatTimeSlot, SERVICE_TYPE_CONFIG } from "@/lib/constants";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada — los emails no se enviarán.");
    return null;
  }
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/** Email "from" por defecto */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Shine <noreply@shine.delivery>";

// ─────────────────────────────────────────────
// Template HTML del recibo
// ─────────────────────────────────────────────
function buildReceiptHtml(params: {
  order: OrderDoc;
  customer: Pick<UserDoc, "displayName" | "email" | "phone">;
  lang?: "es" | "en";
}): string {
  const { order, customer, lang = "en" } = params;
  const isEn = lang === "en";

  const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
  const serviceLabel = serviceCfg?.label || order.serviceType;
  const displayWeight = order.confirmedWeight ?? order.weight;
  const displayTotal = order.confirmedTotal ?? order.total;
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const receiptNumber = `SH-${order.id.slice(0, 8).toUpperCase()}`;

  const isCash = order.paymentMethod === "cash";
  const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "paid_cash";

  // i18n mini-map
  const L = {
    receipt: isEn ? "Receipt" : "Recibo de Pago",
    thankYou: isEn ? "Thank you for your business!" : "¡Gracias por su preferencia!",
    number: isEn ? "Receipt #" : "Recibo #",
    date: isEn ? "Date" : "Fecha",
    time: isEn ? "Time" : "Hora",
    customer: isEn ? "Customer" : "Cliente",
    details: isEn ? "Order Details" : "Detalles del Pedido",
    item: isEn ? "Item" : "Artículo",
    qty: isEn ? "Qty" : "Cant",
    price: isEn ? "Price" : "Precio",
    amount: isEn ? "Amount" : "Monto",
    lbs: isEn ? "lbs" : "lbs",
    lb: isEn ? "lb" : "lb",
    subtotal: isEn ? "Subtotal" : "Subtotal",
    tax: isEn ? "Tax" : "Impuesto",
    total: isEn ? "Total" : "Total",
    payment: isEn ? "Payment Method" : "Método de Pago",
    card: isEn ? "Credit/Debit Card" : "Tarjeta de Crédito/Débito",
    cash: isEn ? "Cash" : "Efectivo",
    paid: isEn ? "Paid" : "Pagado",
    pending: isEn ? "Pending" : "Pendiente",
    pickup: isEn ? "Pickup Info" : "Información de Recolección",
    status: isEn ? "Status" : "Estado",
    delivered: isEn ? "Delivered" : "Entregado",
    weightNote: isEn ? "Weight adjusted from" : "Peso ajustado de",
    footer1: isEn ? "Shine — Professional Laundry & Cleaning Services" : "Shine — Servicios Profesionales de Lavandería y Limpieza",
    footer2: isEn ? "Questions about this receipt? Contact us anytime." : "¿Preguntas sobre este recibo? Contáctanos en cualquier momento.",
    transactionId: isEn ? "Transaction ID" : "ID de Transacción",
  };

  const address = order.address;
  const formatAddr = (a: Address | null) =>
    a ? `${a.street}, ${a.city} ${a.zip}` : "";

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${L.receipt} - ${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      color: #1a1a1a;
      padding: 0;
      line-height: 1.5;
    }
    .wrapper {
      max-width: 480px;
      margin: 0 auto;
      padding: 24px 16px;
    }
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
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
      letter-spacing: -0.3px;
    }
    .header p {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
    }
    .body { padding: 24px; }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #666;
      padding: 4px 0;
    }
    .meta-row .value { font-weight: 600; color: #333; }
    .divider { border: none; border-top: 1px dashed #e5e7eb; margin: 16px 0; }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .customer-info { margin-bottom: 16px; }
    .customer-info p {
      font-size: 13px;
      color: #444;
      line-height: 1.8;
    }
    .customer-info .label { color: #9ca3af; font-size: 11px; }
    table.items { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
    table.items th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      text-align: left;
      padding: 8px 0;
      border-bottom: 2px solid #f3f4f6;
    }
    table.items th:last-child { text-align: right; }
    table.items td {
      font-size: 13px;
      padding: 10px 0;
      border-bottom: 1px solid #f9fafb;
      color: #333;
    }
    table.items td:last-child { text-align: right; font-weight: 500; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #666;
      padding: 3px 0;
    }
    .totals-row.grand {
      font-size: 18px;
      font-weight: 700;
      color: #111;
      padding-top: 12px;
      margin-top: 8px;
      border-top: 2px solid #e5e7eb;
    }
    .payment-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: ${isPaid ? "#f0fdf4" : "#fffbeb"};
      border-radius: 10px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .badge-paid { background: #166534; color: #fff; }
    .badge-pending { background: #f59e0b; color: #fff; }
    .pickup-info { margin-bottom: 16px; }
    .pickup-info p { font-size: 13px; color: #555; line-height: 1.8; }
    .weight-note {
      font-size: 11px;
      color: #d97706;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #fffbeb;
      border-radius: 6px;
    }
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: ${order.status === "delivered" || order.status === "completed" ? "#f0fdf4" : "#f9fafb"};
      border-radius: 10px;
      margin-bottom: 16px;
    }
    .status-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      background: ${order.status === "delivered" || order.status === "completed" ? "#166534" : "#d1d5db"};
      color: #fff;
    }
    .footer {
      text-align: center;
      padding: 20px 24px;
      border-top: 1px solid #f3f4f6;
    }
    .footer .thanks { font-size: 14px; font-weight: 600; color: #7c3aed; margin-bottom: 4px; }
    .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .transaction-id { font-size: 10px; color: #b0b0b0; text-align: center; margin-top: 8px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <h1>✨ Shine</h1>
        <p>${isEn ? "Professional Laundry & Cleaning Services" : "Servicios Profesionales de Lavandería y Limpieza"}</p>
      </div>

      <div class="body">
        <!-- Meta -->
        <div class="meta-row">
          <span>${L.receipt}</span>
          <span class="value">${receiptNumber}</span>
        </div>
        <div class="meta-row">
          <span>${L.date}</span>
          <span class="value">${createdAt.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div class="meta-row">
          <span>${L.time}</span>
          <span class="value">${createdAt.toLocaleTimeString(lang === "en" ? "en-US" : "es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <hr class="divider" />

        <!-- Customer -->
        <div class="customer-info">
          <p class="section-label">${L.customer}</p>
          <p><strong>${customer.displayName || customer.email}</strong></p>
          <p>${customer.email}</p>
          ${customer.phone ? `<p>${customer.phone}</p>` : ""}
        </div>

        <!-- Items -->
        <p class="section-label">${L.details}</p>
        ${order.serviceType === "house_cleaning" ? `
          <div style="margin-bottom: 16px;">
            <p style="font-size: 13px; color: #333; font-weight: 500;">${serviceLabel}</p>
            ${order.cleaningDescription ? `<p style="font-size: 12px; color: #666; margin-top: 4px;">${order.cleaningDescription}</p>` : ""}
          </div>
        ` : `
          <table class="items">
            <thead>
              <tr>
                <th>${L.item}</th>
                <th style="text-align:center;">${L.qty}</th>
                <th style="text-align:right;">${L.amount}</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item) => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align:center;">${item.quantity} ${L.lbs}</td>
                  <td style="text-align:right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}

        ${order.confirmedWeight && order.confirmedWeight !== order.weight ? `
          <div class="weight-note">
            ⚠️ ${L.weightNote} ${order.weight} → ${order.confirmedWeight} ${L.lbs}
          </div>
        ` : ""}

        <!-- Totals -->
        <div style="margin-bottom: 16px;">
          <div class="totals-row">
            <span>${L.subtotal}</span>
            <span>$${displayTotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>${L.tax}</span>
            <span>$0.00</span>
          </div>
          <div class="totals-row grand">
            <span>${L.total}</span>
            <span>$${displayTotal.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment -->
        <div class="payment-row">
          <span style="font-size: 13px; color: #444;">
            ${isCash ? `💵 ${L.cash}` : `💳 ${L.card}`}
          </span>
          ${isPaid
            ? `<span class="badge badge-paid">${L.paid} ✓</span>`
            : `<span class="badge badge-pending">${L.pending}</span>`
          }
        </div>

        <!-- Transaction ID -->
        ${order.stripePaymentIntentId ? `
          <p class="transaction-id">${L.transactionId}: ${order.stripePaymentIntentId}</p>
        ` : ""}

        <!-- Pickup -->
        ${order.pickupDate ? `
          <div class="pickup-info">
            <p class="section-label">${L.pickup}</p>
            <p>${order.pickupDate}${order.pickupTime ? ` · ${formatTimeSlot(order.pickupTime)}` : ""}</p>
            ${address ? `<p style="color: #888; margin-top: 2px;">${formatAddr(address)}</p>` : ""}
          </div>
        ` : ""}

        <!-- Status -->
        <div class="status-row">
          <span style="font-size: 13px; color: #555;">${L.status}</span>
          <span class="status-badge">${order.status === "delivered" ? L.delivered : order.status}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="thanks">${L.thankYou}</p>
        <p>${L.footer1}</p>
        <p>${L.footer2}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export interface SendReceiptParams {
  order: OrderDoc;
  customer: Pick<UserDoc, "displayName" | "email" | "phone">;
  lang?: "es" | "en";
}

/**
 * Envía un recibo de pago por email al cliente.
 * Retorna true si se envió correctamente, false si falló o no hay API key.
 */
export async function sendReceiptEmail(params: SendReceiptParams): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const { order, customer, lang = "en" } = params;
  const toEmail = customer.email;
  if (!toEmail) {
    console.warn("[email] No hay email del cliente — no se puede enviar recibo.");
    return false;
  }

  const receiptNumber = `SH-${order.id.slice(0, 8).toUpperCase()}`;
  const subject =
    lang === "en"
      ? `Receipt ${receiptNumber} — Shine`
      : `Recibo ${receiptNumber} — Shine`;

  const html = buildReceiptHtml(params);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("[email] Error enviando recibo:", error);
      return false;
    }

    console.log(`[email] Recibo enviado a ${toEmail} — ID: ${data?.id}`);
    return true;
  } catch (err: any) {
    console.error("[email] Excepción enviando recibo:", err.message);
    return false;
  }
}
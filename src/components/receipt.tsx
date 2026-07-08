"use client";

/**
 * Receipt.tsx
 * Professional receipt component for printing / saving as PDF.
 * Shows logo, company info, order details, payment info, and totals.
 * Uses window.print() to generate a clean PDF.
 */

import { useRef } from "react";
import Image from "next/image";
import { X, Printer } from "lucide-react";
import type { OrderDoc } from "@/lib/types";
import { SERVICE_TYPE_CONFIG, ORDER_STATUS_CONFIG, formatTimeSlot } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface ReceiptProps {
  order: OrderDoc;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onClose: () => void;
}

export function Receipt({ order, customerName, customerEmail, customerPhone, onClose }: ReceiptProps) {
  const { t } = useTranslation();
  const receiptRef = useRef<HTMLDivElement>(null);
  const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const displayWeight = order.confirmedWeight ?? order.weight;
  const displayTotal = order.confirmedTotal ?? order.total;
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const receiptNumber = `SH-${order.id.slice(0, 8).toUpperCase()}`;

  function handlePrint() {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("receipt.title")} - ${receiptNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #fff;
            color: #1a1a1a;
            padding: 0;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            padding: 32px 24px;
          }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { width: 64px; height: 64px; margin: 0 auto 8px; object-fit: contain; }
          .company-name { font-size: 24px; font-weight: 700; color: #7c3aed; letter-spacing: -0.5px; }
          .company-tagline { font-size: 11px; color: #888; margin-top: 2px; }
          .divider { border: none; border-top: 2px dashed #e5e5e5; margin: 16px 0; }
          .divider-solid { border: none; border-top: 1px solid #e5e5e5; margin: 12px 0; }
          .receipt-meta { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 4px; }
          .receipt-number { font-weight: 600; color: #333; font-size: 13px; }
          .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
          .customer-info { margin-bottom: 16px; }
          .customer-info p { font-size: 12px; color: #444; line-height: 1.6; }
          .customer-info .label { color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .items-table { width: 100%; margin-bottom: 16px; }
          .items-table th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; text-align: left; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
          .items-table th:last-child, .items-table td:last-child { text-align: right; }
          .items-table td { font-size: 13px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #333; }
          .totals { margin-bottom: 16px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: #444; padding: 4px 0; }
          .totals-row.grand { font-size: 18px; font-weight: 700; color: #1a1a1a; padding: 12px 0 0; border-top: 2px solid #e5e5e5; margin-top: 8px; }
          .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .payment-paid { background: #dcfce7; color: #166534; }
          .payment-pending { background: #fef3c7; color: #92400e; }
          .pickup-info { margin-bottom: 16px; }
          .pickup-info p { font-size: 12px; color: #444; line-height: 1.8; }
          .pickup-info .icon-label { display: flex; align-items: center; gap: 6px; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; }
          .footer p { font-size: 11px; color: #999; line-height: 1.6; }
          .footer .thank-you { font-size: 14px; font-weight: 600; color: #7c3aed; margin-bottom: 4px; }
          .status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 10px 14px; border-radius: 10px; }
          .status-delivered { background: #f0fdf4; }
          .status-other { background: #f8f8f8; }
          .status-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
          .status-delivered .status-badge { background: #166534; color: #fff; }
          .status-other .status-badge { background: #e5e5e5; color: #555; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="receipt" id="print-area"></div>
        <script>
          // Copy the receipt content
          const source = window.opener.document.getElementById('receipt-content');
          const target = document.getElementById('print-area');
          if (source && target) {
            target.innerHTML = source.innerHTML;
            // Replace img src with the full URL
            const imgs = target.querySelectorAll('img');
            imgs.forEach(img => {
              if (img.src && !img.src.startsWith('data:')) {
                img.src = img.src;
              }
            });
            setTimeout(() => { window.print(); window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-card shadow-2xl">
        {/* Close + Print buttons */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-card/95 px-4 py-3 backdrop-blur-sm rounded-t-2xl">
          <h3 className="text-sm font-semibold">{t("receipt.title")}</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs border-white/10">
              <Printer className="h-3.5 w-3.5" />
              PDF
            </Button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Receipt content — this gets cloned for printing */}
        <div ref={receiptRef} id="receipt-content" className="bg-white text-gray-900 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <img
              src="/shine-logo.png"
              alt="Shine"
              className="mx-auto mb-2 h-14 w-auto object-contain"
              width={56}
              height={56}
            />
            <p className="text-2xl font-bold text-purple-600 tracking-tight">Shine</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t("receipt.tagline")}</p>
          </div>

          <hr className="border-dashed border-gray-300 my-4" />

          {/* Receipt meta */}
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t("receipt.number")}</span>
            <span className="font-semibold text-gray-700 text-[13px]">{receiptNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t("receipt.date")}</span>
            <span>{createdAt?.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t("receipt.time")}</span>
            <span>{createdAt?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <hr className="border-gray-200 my-4" />

          {/* Customer */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{t("receipt.customer")}</p>
            {customerName && <p className="text-[13px] text-gray-700">{customerName}</p>}
            {customerEmail && <p className="text-[12px] text-gray-500">{customerEmail}</p>}
            {customerPhone && <p className="text-[12px] text-gray-500">{customerPhone}</p>}
          </div>

          {/* Items table */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{t("receipt.details")}</p>
          <table className="w-full mb-4">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                <th className="text-left pb-2 border-b border-gray-200">{t("receipt.item")}</th>
                <th className="text-right pb-2 border-b border-gray-200">{t("receipt.qty")}</th>
                <th className="text-right pb-2 border-b border-gray-200">{t("receipt.price")}</th>
                <th className="text-right pb-2 border-b border-gray-200">{t("receipt.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="text-[13px] text-gray-700">
                  <td className="py-2.5 border-b border-gray-100">{item.name}</td>
                  <td className="text-right py-2.5 border-b border-gray-100">{item.quantity} {t("receipt.lbs")}</td>
                  <td className="text-right py-2.5 border-b border-gray-100">${item.unitPrice.toFixed(2)}/{t("receipt.lb")}</td>
                  <td className="text-right py-2.5 border-b border-gray-100 font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Confirmed weight note */}
          {order.confirmedWeight && order.confirmedWeight !== order.weight && (
            <p className="text-[11px] text-amber-600 mb-2">
              * {t("receipt.weightNote")} {order.weight} → {order.confirmedWeight} {t("receipt.lbs")}
            </p>
          )}

          {/* Totals */}
          <div className="mb-4">
            <div className="flex justify-between text-[13px] text-gray-500 py-1">
              <span>{t("receipt.subtotal")}</span>
              <span>${displayTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-gray-500 py-1">
              <span>{t("receipt.tax")}</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-[18px] font-bold text-gray-900 pt-3 mt-2 border-t-2 border-gray-300">
              <span>{t("receipt.total")}</span>
              <span>${displayTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{t("receipt.payment")}</p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">
                {order.paymentMethod === "card" ? t("receipt.card") : t("receipt.cash")}
              </span>
              {(order.paymentStatus === "paid" || order.paymentStatus === "paid_cash") ? (
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                  {t("receipt.paid")}
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                  {t("receipt.pending")}
                </span>
              )}
            </div>
          </div>

          {/* Pickup info */}
          {order.pickupDate && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{t("receipt.pickup")}</p>
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {order.pickupDate}
                {order.pickupTime && ` · ${formatTimeSlot(order.pickupTime)}`}
              </p>
              {order.address && (
                <p className="text-[12px] text-gray-500 mt-1">
                  {order.address.street}, {order.address.city} {order.address.zip}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div className={`flex items-center justify-between rounded-lg p-3 mb-2 ${order.status === "delivered" ? "bg-green-50" : "bg-gray-50"}`}>
            <span className="text-[12px] text-gray-600">{t("receipt.status")}</span>
            <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${order.status === "delivered" ? "bg-green-700 text-white" : "bg-gray-200 text-gray-600"}`}>
              {statusCfg?.label || order.status}
            </span>
          </div>

          <hr className="border-gray-200 my-4" />

          {/* Footer */}
          <div className="text-center">
            <p className="text-[14px] font-semibold text-purple-600 mb-1">{t("receipt.thankYou")}</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t("receipt.footerLine1")}
              <br />
              {t("receipt.footerLine2")}
            </p>
          </div>
        </div>

        {/* Print button at bottom */}
        <div className="p-4 border-t border-white/[0.06]">
          <Button onClick={handlePrint} className="w-full gradient-button gap-2 h-11">
            <Printer className="h-4 w-4" />
            {t("receipt.downloadPdf")}
          </Button>
        </div>
      </div>
    </div>
  );
}
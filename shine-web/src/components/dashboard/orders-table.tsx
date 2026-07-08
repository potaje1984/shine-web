"use client";

/**
 * OrdersTable.tsx
 * Customer orders table with status filter.
 * Shows only the customer's orders (filtered by useOrders hook).
 * Cleaning orders in "quoted" status show Accept/Reject buttons.
 */

import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { SERVICE_TYPE_CONFIG, ORDER_STATUS_CONFIG, formatTimeSlot, isCleaningService } from "@/lib/constants";
import { Receipt } from "@/components/receipt";
import type { OrderDoc, OrderStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, FileText, Check, X, Loader2, DollarSign, AlertCircle, PackageCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function OrdersTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [receiptOrder, setReceiptOrder] = useState<OrderDoc | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { orders, loading, acceptCleaningQuote, rejectCleaningQuote } = useOrders(
    statusFilter === "all" ? undefined : { status: statusFilter as OrderStatus }
  );
  const { profile } = useAuth();
  const { t } = useTranslation();

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: t("dashboard.ordersTable.allStatuses") },
    ...Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: cfg.label,
    })),
  ];

  async function handleAcceptQuote(orderId: string) {
    setAcceptingId(orderId);
    setActionError(null);
    try {
      await acceptCleaningQuote(orderId);
    } catch (e: any) {
      setActionError(e.message || t("cleaning.customer.acceptError"));
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleRejectQuote(orderId: string) {
    setAcceptingId(orderId);
    setActionError(null);
    try {
      await rejectCleaningQuote(orderId);
    } catch (e: any) {
      setActionError(e.message || t("cleaning.customer.rejectError"));
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 border-white/10 bg-white/5">
            <SelectValue placeholder={t("dashboard.ordersTable.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {orders.length} {orders.length !== 1 ? t("dashboard.ordersTable.orders") : t("dashboard.ordersTable.order")}
        </span>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="glass-strong rounded-2xl border border-white/[0.06] p-8 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("dashboard.ordersTable.noOrders")}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {statusFilter !== "all"
              ? t("dashboard.ordersTable.noOrdersFiltered")
              : t("dashboard.ordersTable.noOrdersDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
            const weight = order.weight;
            const pricePerPound = order.pricePerPound;
            const isCleaning = isCleaningService(order.serviceType);
            const isQuoted = order.status === "quoted";
            const isActing = acceptingId === order.id;

            return (
              <div key={order.id} className={`rounded-xl border px-4 py-3 transition-all hover:border-white/10 ${isQuoted ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06] glass-strong"}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {serviceCfg?.label || order.serviceType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCleaning
                        ? order.quotedPrice
                          ? `$${order.quotedPrice.toFixed(2)} (${t("cleaning.customer.quoted") || "quoted"})`
                          : t("cleaning.customer.awaitingQuote")
                        : weight
                          ? `${weight} lbs`
                          : `${order.items.length} ${order.items.length !== 1 ? t("dashboard.ordersTable.items") : t("dashboard.ordersTable.item")}`
                      }
                      {pricePerPound ? ` · $${pricePerPound.toFixed(2)}/lbs` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {order.pickupTime
                        ? `${formatTimeSlot(order.pickupTime)} · ${order.pickupDate || ""}`
                        : (order.pickupDate || "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCleaning && order.quotedPrice && (
                      <span className="text-sm font-semibold text-amber-400">
                        ${order.quotedPrice.toFixed(2)}
                      </span>
                    )}
                    {!isCleaning && (
                      <span className="text-sm font-semibold">
                        ${order.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:text-primary hover:bg-primary/10"
                      title={t("receipt.title")}
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                {/* Quote acceptance UI */}
                {isQuoted && (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-semibold text-amber-300">
                        {t("cleaning.customer.quoteReceived")}: ${order.quotedPrice?.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("cleaning.customer.quoteMessage")}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptQuote(order.id)}
                        disabled={isActing}
                        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isActing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {t("cleaning.customer.acceptQuote")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectQuote(order.id)}
                        disabled={isActing}
                        className="flex-1 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("cleaning.customer.rejectQuote")}
                      </Button>
                    </div>
                  </div>
                )}
              {/* Delivery photo */}
                {order.status === "delivered" && order.deliveryPhotoUrl && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <PackageCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <Camera className="h-3 w-3" />
                        {t("delivery.photoLabel") || "Delivery Photo"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("delivery.photoDescription") || "Your order has been delivered. Tap to view the confirmation photo."}
                      </p>
                      <a href={order.deliveryPhotoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                        <img
                          src={order.deliveryPhotoUrl}
                          alt="Delivery confirmation"
                          className="max-h-40 w-full rounded-lg border border-white/10 object-cover"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Receipt modal */}
    {receiptOrder && (
      <Receipt
        order={receiptOrder}
        customerName={profile?.displayName || undefined}
        customerEmail={profile?.email || undefined}
        customerPhone={profile?.phone || undefined}
        onClose={() => setReceiptOrder(null)}
      />
    )}
    </>
  );
}
"use client";

/**
 * Admin Orders Page — Full order management.
 * Features:
 * - Horizontal scrollable status tabs (like Instagram stories)
 * - Order cards with action buttons
 * - Order detail bottom sheet on tap
 */

import { useState, useEffect } from "react";
import { ShoppingBag, Loader2, ChevronUp, MapPin, FileText, Calendar, Clock, CreditCard, Banknote, Check, Scale, Navigation, Home, DollarSign } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useCollection, orderBy } from "@/hooks/use-firestore";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  ORDER_STATUS_CONFIG,
  SERVICE_TYPE_CONFIG,
  formatTimeSlot,
  isCleaningService,
} from "@/lib/constants";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import type { OrderDoc, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// All statuses for tabs
const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "pending_quote",
  "quoted",
  "accepted",
  "in_progress",
  "completed",
  "picked_up",
  "in_wash",
  "ready",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: allOrders, loading: ordersLoading } = useCollection<OrderDoc>(
    "orders",
    orderBy("createdAt", "desc")
  );

  // Siempre usar la versión más reciente del pedido de Firestore
  const selectedOrder = selectedOrderId
    ? allOrders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  // Filter orders by tab
  const filteredOrders =
    activeTab === "all"
      ? allOrders
      : allOrders.filter((o) => o.status === activeTab);

  // Count by status
  const statusCounts = ALL_STATUSES.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s] = allOrders.filter((o) => o.status === s).length;
      return acc;
    },
    {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">{t("admin.orders.title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {filteredOrders.length} {filteredOrders.length !== 1 ? t("admin.orders.orders") : t("admin.orders.order")}
        </p>
      </div>

      {/* Status Tabs — horizontal scroll */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <TabButton
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          count={allOrders.length}
        >
          {t("admin.orders.all")}
        </TabButton>
        {ALL_STATUSES.map((status) => (
          <TabButton
            key={status}
            active={activeTab === status}
            onClick={() => setActiveTab(status)}
            count={statusCounts[status] || 0}
            colorClass={ORDER_STATUS_CONFIG[status].color}
          >
            {t(`status.${statusTabKey(status)}`)}
          </TabButton>
        ))}
      </div>

      {/* Order List */}
      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
          <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("admin.orders.noOrders")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              onTap={() => setSelectedOrderId(order.id)}
            />
          ))}
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl border-white/[0.06] bg-background">
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="text-left">
              {selectedOrder
                ? `${SERVICE_TYPE_CONFIG[selectedOrder.serviceType]?.label || selectedOrder.serviceType}`
                : ""}
            </SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrderId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ──────────── Sub-components ──────────── */

function TabButton({
  children,
  active,
  onClick,
  count,
  colorClass,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : colorClass
              ? cn("bg-white/[0.06]", colorClass)
              : "bg-white/[0.06] text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function AdminOrderCard({
  order,
  onTap,
}: {
  order: OrderDoc;
  onTap: () => void;
}) {
  const { t } = useTranslation();
  const { updateOrderStatus, getNextStatuses } = useOrders();
  const [updating, setUpdating] = useState<string | null>(null);

  const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
  const nextStatuses = getNextStatuses(order.status);
  const isTerminal = order.status === "delivered" || order.status === "cancelled";

  async function handleAdvance(e: React.MouseEvent, newStatus: OrderStatus) {
    e.stopPropagation();
    setUpdating(newStatus);
    try {
      await updateOrderStatus(order.id, newStatus);
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <button
      onClick={onTap}
      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all active:scale-[0.98] active:bg-white/[0.04]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{serviceCfg?.label || order.serviceType}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.weight} lbs · ${order.total.toFixed(2)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Pickup info */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {order.pickupDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {order.pickupDate}
          </span>
        )}
        {order.pickupTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeSlot(order.pickupTime)}
          </span>
        )}
        {order.address?.street && (
          <span className="flex items-center gap-1 truncate max-w-[180px]">
            <MapPin className="h-3 w-3 shrink-0" />
            {order.address.street}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {!isTerminal && nextStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => {
            const isCancel = nextStatus === "cancelled";
            return (
              <span key={nextStatus} onClick={(e) => handleAdvance(e, nextStatus)}>
                <Button
                  size="sm"
                  disabled={updating !== null}
                  variant={isCancel ? "ghost" : "default"}
                  className={cn(
                    "h-8 text-xs",
                    isCancel
                      ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      : "gradient-button"
                  )}
                >
                  {updating === nextStatus ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {isCancel
                    ? t("admin.actions.cancel")
                    : t(`admin.actions.${nextStatus}`)}
                </Button>
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

function OrderDetailSheet({ order, onClose }: { order: OrderDoc; onClose: () => void }) {
  const { t } = useTranslation();
  const { updateOrderStatus, getNextStatuses, setCleaningQuote, chargeCleaningOrder } = useOrders();
  const [updating, setUpdating] = useState<string | null>(null);

  const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const nextStatuses = getNextStatuses(order.status);
  const isTerminal = order.status === "delivered" || order.status === "completed" || order.status === "cancelled";
  const isCleaning = isCleaningService(order.serviceType);

  async function handleAdvance(newStatus: OrderStatus) {
    setUpdating(newStatus);
    try {
      await updateOrderStatus(order.id, newStatus);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setUpdating(null);
    }
  }

  // Decide which special section to show (weight confirm, quote price, charge, etc.)
  const showConfirmWeight = !isCleaning && order.status === "picked_up" && order.paymentMethod === "card" && order.paymentStatus !== "paid" && order.paymentStatus !== "paid_cash";
  const showMarkCashPaid = !isCleaning && order.status === "picked_up" && order.paymentMethod === "cash" && order.paymentStatus === "pending";
  const showSetQuote = isCleaning && order.status === "pending_quote";
  const showChargeCleaning = isCleaning && order.status === "accepted" && order.paymentMethod === "card" && order.paymentStatus !== "paid" && order.paymentStatus !== "paid_cash";
  const showCleaningCashPaid = isCleaning && order.status === "accepted" && order.paymentMethod === "cash" && order.paymentStatus === "pending";

  return (
    <>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
        <div className="space-y-4">
          {/* Status + Price */}
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} className="text-sm px-3 py-1" />
            <span className="text-xl font-bold">
              {isCleaning && !order.quotedPrice
                ? t("cleaning.admin.awaitingQuote")
                : `$${(order.quotedPrice || order.total || 0).toFixed(2)}`}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label={t("admin.detail.service")} value={serviceCfg?.label || order.serviceType} />
            {isCleaning ? (
              <DetailItem label={t("cleaning.form.cleaningType")} value={order.cleaningType || "-"} />
            ) : (
              <DetailItem label={t("admin.detail.weight")} value={`${order.weight} lbs`} />
            )}
            {isCleaning ? (
              <DetailItem label={t("admin.detail.orderId")} value={order.id.slice(0, 8)} />
            ) : (
              <DetailItem label={t("admin.detail.pricePerLb")} value={`$${order.pricePerPound.toFixed(2)}`} />
            )}
            <DetailItem label={t("admin.detail.orderId")} value={order.id.slice(0, 8)} />
          </div>

          {/* Cleaning description */}
          {isCleaning && order.cleaningDescription && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("cleaning.form.description")}
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm">{order.cleaningDescription}</p>
              </div>
            </div>
          )}

          {/* Pickup info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("admin.detail.pickupInfo")}
            </p>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5">
              {order.pickupDate && (
                <p className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {order.pickupDate}
                </p>
              )}
              {order.pickupTime && (
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatTimeSlot(order.pickupTime)}
                </p>
              )}
              {order.address && (
                <NavigateButton address={order.address} />
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("common.notes")}
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("admin.detail.payment")}
            </p>
            <div className="flex items-center gap-2">
              {order.paymentMethod === "card" ? (
                <CreditCard className="h-4 w-4 text-purple-400" />
              ) : (
                <Banknote className="h-4 w-4 text-emerald-400" />
              )}
              <span className="text-sm">
                {order.paymentMethod === "card" ? t("payment.card") : t("payment.cash")}
              </span>
              {order.paymentStatus && (
                <span className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
                  order.paymentStatus === "paid" || order.paymentStatus === "paid_cash" || order.paymentStatus === "card_saved"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : order.paymentStatus === "failed"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-amber-500/15 text-amber-400"
                )}>
                  {t(`payment.status.${order.paymentStatus}`)}
                </span>
              )}
            </div>
          </div>

          {/* Special action sections (scroll with content) */}
          {showConfirmWeight && <ConfirmWeightAndCharge order={order} onCharged={onClose} />}
          {showMarkCashPaid && <MarkCashPaid order={order} onMarked={onClose} />}
          {showSetQuote && <SetQuotePrice order={order} onQuoted={onClose} />}
          {showChargeCleaning && <ChargeCleaningPayment order={order} onCharged={onClose} />}
          {showCleaningCashPaid && <MarkCashPaid order={order} onMarked={onClose} />}

          {/* Created date */}
          <p className="text-center text-[10px] text-muted-foreground/50 pb-2">
            {t("admin.detail.created")}: {order.createdAt}
          </p>
        </div>
      </div>

      {/* Sticky action buttons — always visible at bottom of sheet */}
      {!isTerminal && nextStatuses.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.06] bg-background px-5 pt-3 pb-6">
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((nextStatus) => {
              const isCancel = nextStatus === "cancelled";
              return (
                <Button
                  key={nextStatus}
                  size="lg"
                  disabled={updating !== null}
                  variant={isCancel ? "outline" : "default"}
                  className={cn(
                    "flex-1 min-w-[120px] h-12 text-sm font-semibold rounded-xl",
                    isCancel
                      ? "border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      : "gradient-button"
                  )}
                  onClick={() => handleAdvance(nextStatus)}
                >
                  {updating === nextStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCancel
                    ? t("admin.actions.cancel")
                    : t(`admin.actions.${nextStatus}`)}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

/** Maps OrderStatus to i18n key */
function statusTabKey(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "pending",
    pending_quote: "pendingQuote",
    quoted: "quoted",
    accepted: "accepted",
    in_progress: "inProgress",
    completed: "completed",
    picked_up: "pickedUp",
    in_wash: "washing",
    ready: "ready",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  return map[status];
}

/* ──────────── Navigation button ──────────── */

function NavigateButton({ address }: { address: { street: string; city: string; zip: string } }) {
  const { t } = useTranslation();
  const [distance, setDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullAddress = `${address.street}, ${address.city} ${address.zip}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  async function getDistance() {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latitude},${longitude}&destinations=${encodeURIComponent(fullAddress)}&units=imperial&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}`
      );
      const data = await res.json();

      if (data.rows?.[0]?.elements?.[0]?.distance) {
        const miles = (data.rows[0].elements[0].distance.value / 1609.34).toFixed(1);
        setDistance(`${miles} mi`);
      }
    } catch {
      // Si falla geolocalización o API, simplemente no muestra distancia
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        getDistance();
        window.open(mapsUrl, "_blank");
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-left text-sm transition-all hover:bg-blue-500/10 active:scale-[0.98]"
    >
      <MapPin className="h-4 w-4 shrink-0 text-blue-400" />
      <span className="flex-1 truncate text-foreground/90">{fullAddress}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {distance && (
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
            {distance}
          </span>
        )}
        <Navigation className="h-4 w-4 text-blue-400" />
      </div>
    </button>
  );
}

/* ──────────── Payment sub-components ──────────── */

function ConfirmWeightAndCharge({ order, onCharged }: { order: OrderDoc; onCharged: () => void }) {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(order.confirmedWeight ?? order.weight);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const confirmedTotal = weight * order.pricePerPound;

  async function handleConfirmAndCharge() {
    setLoading(true);
    setError(null);

    try {
      await initFirebase();
      const db = getFirestoreInstance();
      if (!db) throw new Error("Firestore not available");

      // Update confirmed weight in Firestore
      await updateDoc(doc(db, "orders", order.id), {
        confirmedWeight: weight,
        confirmedTotal: confirmedTotal,
        total: confirmedTotal, // update displayed total
        updatedAt: new Date().toISOString(),
      });

      // If card payment, charge via Stripe
      if (order.paymentMethod === "card" && order.stripePaymentMethodId) {
        const res = await fetch("/api/stripe/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            stripeCustomerId: order.stripeCustomerId || null,
            stripePaymentMethodId: order.stripePaymentMethodId,
            amount: Math.round(confirmedTotal * 100),
            confirmedWeight: weight,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          await updateDoc(doc(db, "orders", order.id), {
            paymentStatus: "failed",
            updatedAt: new Date().toISOString(),
          });
          throw new Error(data.error || "Charge failed");
        }

        // Mark as paid + guardar customerId si era nuevo
        const updateData: Record<string, unknown> = {
          paymentStatus: "paid",
          stripePaymentIntentId: data.paymentIntentId,
          updatedAt: new Date().toISOString(),
        };
        if (data.customerId && !order.stripeCustomerId) {
          updateData.stripeCustomerId = data.customerId;
        }
        await updateDoc(doc(db, "orders", order.id), updateData);
      }

      setSuccess(true);
      setTimeout(() => onCharged(), 1500);
    } catch (err: any) {
      setError(err.message || t("payment.chargeError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
        <Check className="h-5 w-5" />
        {t("payment.chargeSuccess")}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Scale className="h-3.5 w-3.5" />
        {t("admin.detail.confirmWeight")}
      </p>

      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-24 border-white/10 bg-white/5 text-center"
          min={1}
        />
        <span className="text-sm text-muted-foreground">lbs</span>
        <span className="ml-auto text-lg font-bold">
          ${confirmedTotal.toFixed(2)}
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">{error}</div>
      )}

      <Button
        onClick={handleConfirmAndCharge}
        disabled={loading || weight < 1}
        className={cn(
          "w-full h-12 text-sm font-semibold rounded-xl gap-2",
          order.paymentMethod === "card" ? "gradient-button" : ""
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : order.paymentMethod === "card" ? (
          <CreditCard className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {order.paymentMethod === "card"
          ? t("admin.detail.confirmAndCharge")
          : t("admin.detail.confirmWeight")}
      </Button>
    </div>
  );
}

function MarkCashPaid({ order, onMarked }: { order: OrderDoc; onMarked: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);

  async function handleMarkPaid() {
    setLoading(true);
    setReceiptSent(false);
    try {
      await initFirebase();
      const db = getFirestoreInstance();
      if (!db) return;

      await updateDoc(doc(db, "orders", order.id), {
        paymentStatus: "paid_cash",
        updatedAt: new Date().toISOString(),
      });

      // Enviar recibo por email al cliente
      try {
        const res = await fetch("/api/send-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        if (res.ok) {
          setReceiptSent(true);
          console.log(`[admin] Receipt sent for cash order ${order.id}`);
        } else {
          const data = await res.json();
          console.warn("[admin] Could not send receipt:", data.error);
        }
      } catch (emailErr) {
        // No fallar si el email no se envía
        console.warn("[admin] Email receipt error:", emailErr);
      }

      onMarked();
    } catch (err) {
      console.error("Failed to mark cash paid:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleMarkPaid}
        disabled={loading}
        variant="outline"
        className="w-full h-12 text-sm font-semibold rounded-xl gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Banknote className="h-4 w-4" />
        )}
        {t("admin.detail.markCashPaid")}
      </Button>
      {receiptSent && (
        <p className="text-center text-[11px] text-emerald-400">
          {t("admin.detail.receiptSent") || "Recibo enviado al cliente"}
        </p>
      )}
    </div>
  );
}

/* ──────────── Cleaning admin sub-components ──────────── */

function SetQuotePrice({ order, onQuoted }: { order: OrderDoc; onQuoted: () => void }) {
  const { t } = useTranslation();
  const { setCleaningQuote } = useOrders();
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await setCleaningQuote(order.id, numPrice);
      setSuccess(true);
      setTimeout(() => onQuoted(), 1200);
    } catch (err: any) {
      setError(err.message || "Error al cotizar");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
        <Check className="h-5 w-5" />
        {t("cleaning.admin.quoteSent")}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
        {t("cleaning.admin.setQuoteTitle")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("cleaning.admin.setQuoteDescription")}
      </p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-32 border-white/10 bg-white/5 text-center pl-7"
            min={1}
            step={0.01}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || !Number(price) || Number(price) <= 0}
          className="ml-auto gradient-button gap-2 h-10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
          {t("cleaning.admin.sendQuote")}
        </Button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}

function ChargeCleaningPayment({ order, onCharged }: { order: OrderDoc; onCharged: () => void }) {
  const { t } = useTranslation();
  const { chargeCleaningOrder } = useOrders();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCharge() {
    setLoading(true);
    setError(null);
    try {
      await chargeCleaningOrder(order.id);
      setSuccess(true);
      setTimeout(() => onCharged(), 1200);
    } catch (err: any) {
      setError(err.message || t("payment.chargeError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
        <Check className="h-5 w-5" />
        {t("payment.chargeSuccess")}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5 text-purple-400" />
        {t("cleaning.admin.chargeCard")}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t("cleaning.admin.quotedAmount")}:</span>
        <span className="text-lg font-bold">${(order.quotedPrice || 0).toFixed(2)}</span>
      </div>
      {error && (
        <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">{error}</div>
      )}
      <Button
        onClick={handleCharge}
        disabled={loading}
        className="w-full gradient-button gap-2 h-12"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {t("cleaning.admin.chargeNow")}
      </Button>
    </div>
  );
}
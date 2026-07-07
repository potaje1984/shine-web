"use client";

/**
 * Client Dashboard — Customer-only view.
 * Shows their orders and a "New Order" dialog with service selection.
 * Cleaning orders in "quoted" status show Accept/Reject buttons.
 */

import { useEffect, useState } from "react";
import { ShoppingBag, Plus, Home, Sparkles, Check, X, Loader2, DollarSign, AlertCircle } from "lucide-react";
import { useCollection, orderBy, where } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import type { OrderDoc } from "@/lib/types";
import type { OrderFormValues } from "@/lib/schemas";
import type { CleaningFormValues } from "@/lib/schemas";
import { ORDER_STATUS_CONFIG, SERVICE_TYPE_CONFIG, formatTimeSlot, isCleaningService } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { OrderForm } from "@/components/dashboard/order-form";
import { CleaningOrderForm } from "@/components/dashboard/cleaning-order-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

type ServiceChoice = "laundry" | "cleaning" | null;

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { addOrder, addCleaningOrder, acceptCleaningQuote, rejectCleaningQuote } = useOrders();
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceChoice, setServiceChoice] = useState<ServiceChoice>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const customerWhere = profile?.uid ? [where("userId", "==", profile.uid)] : [];
  const { data: orders, loading: ordersLoading } = useCollection<OrderDoc>(
    "orders",
    ...customerWhere,
    orderBy("createdAt", "desc")
  );

  const isReady = !!profile?.uid;
  const effectiveLoading = ordersLoading || !isReady;
  const recentOrders = orders.slice(0, 10);
  const activeCount = orders.filter(
    (o) => !["delivered", "completed", "cancelled"].includes(o.status)
  ).length;

  useEffect(() => { setMounted(true); }, []);

  function openDialog() {
    setServiceChoice(null);
    setDialogOpen(true);
  }

  async function handleCreateLaundryOrder(data: OrderFormValues & { stripePaymentMethodId?: string; stripeSetupIntentId?: string; stripeCustomerId?: string }) {
    await addOrder({
      serviceType: data.serviceType,
      weight: data.weight,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      address: data.address,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      stripePaymentMethodId: data.stripePaymentMethodId,
      stripeSetupIntentId: data.stripeSetupIntentId,
      stripeCustomerId: data.stripeCustomerId,
    });
    setDialogOpen(false);
  }

  async function handleCreateCleaningOrder(data: CleaningFormValues & { stripePaymentMethodId?: string; stripeSetupIntentId?: string; stripeCustomerId?: string }) {
    await addCleaningOrder({
      cleaningType: data.cleaningType,
      cleaningDescription: data.cleaningDescription,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      address: data.address,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      stripePaymentMethodId: data.stripePaymentMethodId,
      stripeSetupIntentId: data.stripeSetupIntentId,
      stripeCustomerId: data.stripeCustomerId,
    });
    setDialogOpen(false);
  }

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

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {t("client.dashboard.welcome")}{profile?.displayName || t("dashboard.main.defaultUser")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("client.dashboard.subtitle")}
        </p>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {activeCount} {activeCount === 1 ? t("client.dashboard.activeOrder") : t("client.dashboard.activeOrders")}
            </p>
            <p className="text-xs text-muted-foreground">{t("client.dashboard.activeDescription")}</p>
          </div>
        </div>
      )}

      <Button onClick={openDialog} className="w-full gradient-button gap-2 h-12 text-base font-semibold sm:w-auto">
        <Plus className="h-5 w-5" />
        {t("client.dashboard.newOrder")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setServiceChoice(null); setDialogOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-white/[0.06] bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{t("client.dashboard.newOrder")}</DialogTitle>
            <DialogDescription>
              {serviceChoice === null
                ? t("cleaning.form.selectServiceDescription")
                : serviceChoice === "laundry"
                  ? t("dashboard.orders.createOrderDescription")
                  : t("cleaning.form.createCleaningDescription")}
            </DialogDescription>
          </DialogHeader>

          {serviceChoice === null && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setServiceChoice("laundry")}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
                  <Sparkles className="h-7 w-7 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{t("cleaning.form.laundryService")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("cleaning.form.laundryDesc")}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setServiceChoice("cleaning")}
                className="relative flex flex-col items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-[0.97]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
                  <Home className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{t("cleaning.form.cleaningService")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("cleaning.form.cleaningDesc")}</p>
                </div>
              </button>
            </div>
          )}

          {serviceChoice !== null && (
            <button
              type="button"
              onClick={() => setServiceChoice(null)}
              className="mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; {t("cleaning.form.backToServices")}
            </button>
          )}

          {serviceChoice === "laundry" && (
            <OrderForm
              onSubmit={handleCreateLaundryOrder}
              onCancel={() => setDialogOpen(false)}
              defaultAddress={profile?.address || undefined}
              userEmail={profile?.email || undefined}
            />
          )}

          {serviceChoice === "cleaning" && (
            <CleaningOrderForm
              onSubmit={handleCreateCleaningOrder}
              onCancel={() => setDialogOpen(false)}
              defaultAddress={profile?.address || undefined}
              userEmail={profile?.email || undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {actionError}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("client.dashboard.myOrders")}</h2>

        {effectiveLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] p-10 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("client.dashboard.noOrders")}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {t("client.dashboard.noOrdersDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
              const isCleaning = isCleaningService(order.serviceType);
              const isQuoted = order.status === "quoted";
              const isAccepting = acceptingId === order.id;

              return (
                <div
                  key={order.id}
                  className={`glass-strong rounded-xl border px-4 py-3 transition-all hover:border-white/10 ${
                    isQuoted ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isCleaning ? (
                          <Home className="h-3.5 w-3.5 text-cyan-400" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        )}
                        <p className="text-sm font-medium">
                          {serviceCfg?.label || order.serviceType}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isCleaning
                          ? order.quotedPrice
                            ? `$${order.quotedPrice.toFixed(2)} (cotizado)`
                            : "Esperando cotización"
                          : order.weight
                            ? `${order.weight} lbs · $${order.total.toFixed(2)}`
                            : `$${order.total.toFixed(2)}`
                        }
                      </p>
                      <div className="flex gap-2 text-[11px] text-muted-foreground/60">
                        {order.pickupDate && <span>{order.pickupDate}</span>}
                        {order.pickupTime && <span>{formatTimeSlot(order.pickupTime)}</span>}
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Quote acceptance UI for cleaning orders in "quoted" status */}
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
                          disabled={isAccepting}
                          className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isAccepting ? (
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
                          disabled={isAccepting}
                          className="flex-1 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t("cleaning.customer.rejectQuote")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
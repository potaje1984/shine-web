"use client";

/**
 * Admin Dashboard — Mobile-first home screen.
 * Shows KPIs + recent orders with inline action buttons to advance status.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, DollarSign, Clock, Loader2, ChevronRight, Package } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useCollection, orderBy } from "@/hooks/use-firestore";
import { ORDER_STATUS_CONFIG, SERVICE_TYPE_CONFIG, formatTimeSlot, ORDER_STATUS_TRANSITIONS } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import type { OrderDoc, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // All orders for admin
  const { data: orders, loading: ordersLoading } = useCollection<OrderDoc>(
    "orders",
    orderBy("createdAt", "desc")
  );

  // Stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  // Recent orders (last 10)
  const recentOrders = orders.slice(0, 10);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      {/* KPI Grid — 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label={t("admin.dashboard.totalOrders")}
          value={ordersLoading ? "..." : totalOrders}
          icon={ShoppingBag}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <KpiCard
          label={t("admin.dashboard.revenue")}
          value={ordersLoading ? "..." : `$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <KpiCard
          label={t("admin.dashboard.pending")}
          value={ordersLoading ? "..." : pendingOrders}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
        <KpiCard
          label={t("admin.dashboard.inProgress")}
          value={ordersLoading ? "..." : activeOrders}
          icon={Package}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
      </div>

      {/* Recent Orders with actions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("admin.dashboard.recentOrders")}</h2>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
              {t("admin.dashboard.viewAll")}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ──────────── Sub-components ──────────── */

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function OrderCard({ order }: { order: OrderDoc }) {
  const { t } = useTranslation();
  const { updateOrderStatus, getNextStatuses } = useOrders();
  const [updating, setUpdating] = useState(false);

  const serviceCfg = SERVICE_TYPE_CONFIG[order.serviceType];
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const nextStatuses = getNextStatuses(order.status);
  const isTerminal = order.status === "delivered" || order.status === "cancelled";

  async function handleAdvance(newStatus: OrderStatus) {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
    } catch (e) {
      console.error("Failed to update order status:", e);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all">
      {/* Top row: service + status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{serviceCfg?.label || order.serviceType}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.weight} lbs · ${order.total.toFixed(2)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Details */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {order.pickupDate && <span>{order.pickupDate}</span>}
        {order.pickupTime && <span>{formatTimeSlot(order.pickupTime)}</span>}
        {order.address?.street && (
          <span className="truncate max-w-[200px]">{order.address.street}</span>
        )}
      </div>

      {/* Action buttons */}
      {!isTerminal && nextStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => {
            const cfg = ORDER_STATUS_CONFIG[nextStatus];
            const isCancel = nextStatus === "cancelled";
            return (
              <Button
                key={nextStatus}
                size="sm"
                disabled={updating}
                variant={isCancel ? "ghost" : "default"}
                className={cn(
                  "h-8 text-xs",
                  isCancel
                    ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    : "gradient-button"
                )}
                onClick={() => handleAdvance(nextStatus)}
              >
                {updating ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {isCancel
                  ? t("admin.actions.cancel")
                  : t(`admin.actions.${nextStatus}`)
                }
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
"use client";

/**
 * Admin Notifications Page
 * Shows admin notifications (new orders, etc.) with real-time updates.
 */

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ShoppingBag, CreditCard, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { NotificationDoc } from "@/lib/types";

const STATUS_ICONS: Record<string, typeof Bell> = {
  order_status: ShoppingBag,
  payment: CreditCard,
  system: Info,
};

function NotificationCard({ notification, onMarkRead }: { notification: NotificationDoc; onMarkRead: (id: string) => void }) {
  const [marking, setMarking] = useState(false);

  async function handleMarkRead() {
    setMarking(true);
    await onMarkRead(notification.id);
    setMarking(false);
  }

  const Icon = STATUS_ICONS[notification.type] || Bell;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 transition-all",
        !notification.read
          ? "border-primary/20 bg-primary/[0.03]"
          : "border-white/[0.06] bg-white/[0.01] opacity-70"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        notification.type === "order_status" && "bg-blue-500/10 text-blue-400",
        notification.type === "payment" && "bg-emerald-500/10 text-emerald-400",
        notification.type === "system" && "bg-amber-500/10 text-amber-400",
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
          {notification.orderId && (
            <Link
              href="/admin/orders"
              className="text-[10px] text-primary hover:underline"
            >
              Ver pedido
            </Link>
          )}
        </div>
      </div>
      {!notification.read && (
        <button
          onClick={handleMarkRead}
          disabled={marking}
          className="shrink-0 self-center rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-white/[0.04] hover:text-muted-foreground"
          aria-label="Marcar leído"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  if (diffDay < 7) return `Hace ${diffDay}d`;
  return new Date(dateStr).toLocaleDateString("es-US", { month: "short", day: "numeric" });
}

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("admin.notifications.subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <Bell className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {t("admin.notifications.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
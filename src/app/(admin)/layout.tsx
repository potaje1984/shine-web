"use client";

/**
 * Admin Layout — Mobile-first app-like layout.
 * Features:
 * - Compact header with Shine brand
 * - Full-width scrollable content area
 * - Fixed bottom navigation bar (like a native mobile app)
 * - Notification badge + sound on new orders
 * - PWA install prompt
 * - AuthGuard with requireAdmin
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Settings, LogOut, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, requestNotificationPermission } from "@/hooks/use-notifications";
// PWA disabled — Service Worker was caching stale JS
// import { usePwaRegister } from "@/hooks/use-pwa-register";
import { useTranslation } from "@/lib/i18n";
// PWA disabled
// import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", icon: Home, labelKey: "admin.nav.home" },
  { href: "/admin/orders", icon: ShoppingBag, labelKey: "admin.nav.orders" },
  { href: "/admin/notifications", icon: Bell, labelKey: "admin.nav.notifications" },
  { href: "/admin/settings", icon: Settings, labelKey: "admin.nav.settings" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Register service worker for PWA
  // PWA disabled — no service worker
  // usePwaRegister();

  // Show notification permission banner once (non-blocking for admin)
  useEffect(() => {
    if (bannerDismissed) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const perm = Notification.permission;
    if (perm === "default") {
      const timer = setTimeout(() => setShowNotifBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [bannerDismissed]);

  async function handleEnableNotifications() {
    await requestNotificationPermission();
    setShowNotifBanner(false);
    setBannerDismissed(true);
  }

  function handleDismissBanner() {
    setShowNotifBanner(false);
    setBannerDismissed(true);
  }

  return (
    <AuthGuard requireAdmin>
      {/* PWA install prompt */}
      {/* PWA disabled */}
      {/* <PwaInstallPrompt /> */}

      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {/* Notification Permission Banner (non-blocking for admin) */}
        {showNotifBanner && (
          <div className="relative z-[60] flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-3">
            <Bell className="h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-xs text-foreground/90">
              {t("notifications.enablePrompt")}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleEnableNotifications}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("notifications.enable")}
              </button>
              <button
                onClick={handleDismissBanner}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-background/80 px-4 py-3 backdrop-blur-xl">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/shine-logo.png" alt="Shine" width={80} height={44} className="h-6 w-auto rounded-none" />
            <span className="text-base font-bold">Shine</span>
            <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {profile?.displayName || profile?.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              aria-label={t("admin.nav.signOut")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content — scrollable, safe bottom padding for nav */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-24">
          <div className="mx-auto max-w-2xl">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Bar — mobile app style */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const showBadge = item.icon === Bell && unreadCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-xs font-medium transition-all active:scale-95"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors">
                    {isActive && <div className="absolute inset-0 rounded-xl bg-primary/15" />}
                    <Icon className={cn("h-5 w-5 relative z-10", isActive ? "text-primary" : "text-muted-foreground")} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white z-20">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Safe area for notched phones */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </AuthGuard>
  );
}
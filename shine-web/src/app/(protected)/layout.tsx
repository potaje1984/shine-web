"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileCompletionGate } from "@/components/auth/profile-completion-gate";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { usePwaRegister } from "@/hooks/use-pwa-register";
import { useTranslation } from "@/lib/i18n";
import { NotificationGate } from "@/components/notification-gate";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard.nav.summary" },
  { href: "/dashboard/orders", icon: ShoppingBag, labelKey: "dashboard.nav.orders" },
  { href: "/dashboard/notifications", icon: Bell, labelKey: "dashboard.nav.notifications" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "dashboard.nav.settings" },
] as const;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  // Register service worker for PWA
  usePwaRegister();

  return (
    <AuthGuard requireCustomer>
      {/* Mandatory profile completion for social login users missing phone/address */}
      <ProfileCompletionGate />

      {/* Mandatory notification permission gate */}
      <NotificationGate />

      {/* PWA install prompt (shows once per session) */}
      <PwaInstallPrompt />

      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-background/80 px-4 py-3 backdrop-blur-xl">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/shine-logo.png" alt="Shine" width={80} height={44} className="h-6 w-auto rounded-none" />
            <span className="text-base font-bold">Shine</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {profile?.displayName || profile?.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              aria-label={t("dashboard.nav.signOut")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content */}
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
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
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
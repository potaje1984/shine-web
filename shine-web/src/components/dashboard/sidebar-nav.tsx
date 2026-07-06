"use client";

/**
 * SidebarNav.tsx
 * Dashboard sidebar navigation with active route indicator.
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function SidebarNav() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { label: t("dashboard.nav.summary"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("dashboard.nav.orders"), href: "/dashboard/orders", icon: ShoppingBag },
    { label: t("dashboard.nav.settings"), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/[0.06] bg-black/20">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/shine-logo.png" alt="Shine" width={100} height={54} className="rounded-none" />
          <span className="text-lg font-bold">Shine</span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="mb-3 space-y-1">
          <p className="truncate text-sm font-medium">
            {profile?.displayName || user?.email || t("dashboard.nav.user")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.nav.signOut")}
        </Button>
      </div>
    </aside>
  );
}
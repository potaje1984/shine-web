"use client";

/**
 * AuthGuard.tsx
 * Protects routes based on auth + role.
 * - requireAdmin: redirects non-admins to /dashboard
 * - requireCustomer: redirects admins to /admin
 * - default (no flags): just checks auth session
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, also requires admin role */
  requireAdmin?: boolean;
  /** If true, also requires customer role (redirects admins away) */
  requireCustomer?: boolean;
}

export function AuthGuard({ children, requireAdmin = false, requireCustomer = false }: AuthGuardProps) {
  const { t } = useTranslation();
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // No session → redirect to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Admin trying to access customer area → redirect to /admin
    if (requireCustomer && isAdmin) {
      router.replace("/admin");
      return;
    }

    // Non-admin trying to access admin area → redirect to /dashboard
    if (requireAdmin && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
  }, [user, loading, isAdmin, requireAdmin, requireCustomer, router]);

  // Loading session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-8 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
          <p className="text-sm text-muted-foreground">{t("auth.guard.loadingSession")}</p>
        </div>
      </div>
    );
  }

  // Not authenticated (redirecting)
  if (!user) {
    return null;
  }

  // Wrong role (redirecting)
  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireCustomer && isAdmin) {
    return null;
  }

  return <>{children}</>;
}
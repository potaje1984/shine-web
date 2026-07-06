"use client";

/**
 * NotificationGate.tsx
 * MANDATORY notification permission modal.
 * Blocks the entire app until the user grants browser notification permission.
 * If the user denies, they can retry — there is no dismiss option.
 */

import { useEffect, useState } from "react";
import { Bell, Volume2, ShieldCheck } from "lucide-react";
import { requestNotificationPermission } from "@/hooks/use-notifications";
import { useTranslation } from "@/lib/i18n";

export function NotificationGate() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"checking" | "required" | "denied" | "granted">("checking");

  useEffect(() => {
    if (typeof window === "undefined") {
      setStatus("granted"); // SSR — skip
      return;
    }
    if (!("Notification" in window)) {
      // Notifications not supported — skip gate
      setStatus("granted");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") {
      setStatus("granted");
    } else if (perm === "denied") {
      // Already denied — still show gate so they can go to settings
      setStatus("denied");
    } else {
      setStatus("required");
    }
  }, []);

  async function handleAllow() {
    const granted = await requestNotificationPermission();
    if (granted) {
      setStatus("granted");
    } else {
      setStatus("denied");
    }
  }

  // Gate passed — render nothing
  if (status === "granted" || status === "checking") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="mx-6 w-full max-w-sm rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Bell className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-lg font-bold">
          {t("notifications.gate.title")}
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t("notifications.gate.description")}
        </p>

        {/* Features */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Volume2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-foreground/80">
              {t("notifications.gate.featureSound")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-foreground/80">
              {t("notifications.gate.featurePush")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-foreground/80">
              {t("notifications.gate.featurePrivacy")}
            </p>
          </div>
        </div>

        {status === "denied" ? (
          /* Denied state — instructions to re-enable */
          <div className="space-y-3">
            <p className="text-center text-xs text-red-400">
              {t("notifications.gate.deniedMessage")}
            </p>
            <div className="rounded-xl bg-white/5 p-3 text-xs text-muted-foreground">
              {t("notifications.gate.deniedInstructions")}
            </div>
            <button
              onClick={handleAllow}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("notifications.gate.retryButton")}
            </button>
          </div>
        ) : (
          /* Required state — Allow button */
          <button
            onClick={handleAllow}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            {t("notifications.gate.allowButton")}
          </button>
        )}
      </div>
    </div>
  );
}
"use client";

/**
 * PwaInstallPrompt.tsx
 * Custom PWA install banner.
 *
 * Android/Chrome: Intercepts `beforeinstallprompt` and shows a direct install button.
 * iOS/Safari: No API exists, so we detect iOS and show a visual step-by-step guide
 *              teaching the user to tap the Share button → "Add to Home Screen".
 *
 * Only shows once per session.
 */

import { useEffect, useState, useCallback } from "react";
import { Download, X, Smartphone, Zap, Share2, Plus, ArrowUpFromLine } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't show if already installed
    if ((window as unknown as Record<string, boolean>).isAppInstalled) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = detectIOS();
    setIsIOS(ios);

    if (ios) {
      // iOS/Safari: show guide after 4 seconds
      const dismissed = sessionStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      (window as unknown as Record<string, boolean>).isAppInstalled = true;
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      (window as unknown as Record<string, boolean>).isAppInstalled = true;
    }
    setDeferredPrompt(null);
    setShow(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    if (isIOS) {
      sessionStorage.setItem("pwa-ios-dismissed", "1");
    }
  }, [isIOS]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative z-10 mx-4 mb-6 w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-2xl border border-white/10 bg-card p-5 shadow-2xl sm:mb-0">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t("pwa.install.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("pwa.install.subtitle")}</p>
          </div>
        </div>

        {isIOS ? (
          /* iOS Safari — Step by step guide */
          <>
            <div className="mb-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <span className="text-xs text-foreground/80">
                    {t("pwa.ios.step1")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5 text-primary" />
                  <span className="text-xs text-foreground/80">
                    {t("pwa.ios.step2")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  3
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  <span className="text-xs text-foreground/80">
                    {t("pwa.ios.step3")}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Safari share button hint */}
            <div className="mb-4 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[11px] text-muted-foreground">
                <ArrowUpFromLine className="h-4 w-4 animate-bounce text-primary" />
                <span>{t("pwa.ios.hint")}</span>
              </div>
            </div>
          </>
        ) : (
          /* Android/Chrome — Features + Install button */
          <>
            <div className="mb-5 flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-[11px] text-foreground/70">{t("pwa.install.featureApp")}</span>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                <Zap className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-[11px] text-foreground/70">{t("pwa.install.featureFast")}</span>
              </div>
            </div>

            <button
              onClick={handleInstall}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              {t("pwa.install.button")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
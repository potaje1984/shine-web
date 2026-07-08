"use client";

/**
 * SocialLoginButtons.tsx
 * Botones de login social (Google, Facebook, Apple) para Firebase Auth.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Provider = "google" | "facebook" | "apple";

const PROVIDERS: Provider[] = ["google", "facebook", "apple"];

export function SocialLoginButtons({ mode = "login" }: { mode?: "login" | "register" }) {
  const { t } = useTranslation();
  const { signInWithProvider } = useAuth();
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  async function handleSocialLogin(provider: Provider) {
    setLoadingProvider(provider);
    try {
      const user = await signInWithProvider(provider);
      if (user) {
        router.push("/dashboard");
      }
    } catch (e: any) {
      const code = e?.code || "";
      const msg = e?.message || "";

      if (code === "auth/popup-closed-by-user") return;

      if (code === "auth/popup-blocked") {
        toast.error(t("auth.social.errors.popupBlocked"));
      } else if (code === "auth/unauthorized-domain") {
        toast.error(t("auth.social.errors.unauthorizedDomain"));
      } else if (code === "auth/operation-not-supported") {
        toast.error(t("auth.social.errors.notSupported"));
      } else {
        toast.error(t("auth.social.errors.generic"));
      }
      console.error("[SocialLogin]", code, msg, e);
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-muted-foreground">
          {t("auth.social.orContinueWith")}
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin(provider)}
            className={cn(
              "h-11 gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-foreground",
              provider === "google" && "hover:border-red-500/30",
              provider === "facebook" && "hover:border-blue-500/30",
              provider === "apple" && "hover:border-white/30"
            )}
          >
            {loadingProvider === provider ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ProviderIcon provider={provider} />
            )}
            <span className="text-xs font-medium">
              {t(`auth.social.${provider}`)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  switch (provider) {
    case "google":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "apple":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      );
  }
}
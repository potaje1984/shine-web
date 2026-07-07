"use client";

/**
 * LoginForm.tsx
 * Formulario de inicio de sesión con Firebase Auth.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getFirebaseConfigError } from "@/lib/firebase";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const { signIn, error } = useAuth();
  const router = useRouter();

  // Verificar config de Firebase al montar
  useEffect(() => {
    setConfigError(getFirebaseConfigError());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Bloquear si Firebase no está configurado
    const cfgErr = getFirebaseConfigError();
    if (cfgErr) {
      setConfigError(cfgErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      router.push("/dashboard");
    } catch {
      // El error ya se maneja en el hook
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md glass-strong border-white/10">
      <CardHeader className="text-center">
        <Image src="/shine-logo.png" alt="Shine" width={180} height={98} className="mx-auto mb-3 h-16 w-auto sm:h-20 rounded-none" />
        <CardTitle className="text-2xl font-bold">
          {t("auth.login.title")}
        </CardTitle>
        <CardDescription>
          {t("auth.login.subtitle")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {configError && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-400">
              <p className="font-semibold">{t("auth.firebaseWarning.title")}</p>
              <p className="mt-1 text-xs text-amber-300/80">{configError}</p>
              <p className="mt-2 text-xs text-amber-300/70">
                Ejecuta <code className="rounded bg-black/30 px-1">cp .env.example .env.local</code> y edita con tus credenciales.
              </p>
            </div>
          )}
          {!configError && error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error.includes("invalid-credential")
                ? t("auth.login.errors.invalidCredentials")
                : error.includes("too-many-requests")
                  ? t("auth.login.errors.tooManyAttempts")
                  : error.includes("api-key-not-valid")
                    ? t("auth.login.errors.firebaseNotConfigured")
                    : error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              className="border-white/10 bg-white/5"
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-primary/80 transition-colors hover:text-primary hover:underline"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-button"
          >
            {isSubmitting ? t("auth.login.submittingButton") : t("auth.login.submitButton")}
          </Button>
          <SocialLoginButtons />
          <p className="text-sm text-muted-foreground">
            {t("auth.login.noAccount")}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("auth.login.registerLink")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
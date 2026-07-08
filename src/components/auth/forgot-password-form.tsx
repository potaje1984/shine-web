"use client";

/**
 * ForgotPasswordForm.tsx
 * Sends password reset email. Tries branded Resend email first,
 * falls back to Firebase default email (via Resend SMTP) if needed.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      // 1. Try branded Resend email via API (Firebase Admin + Resend)
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && !data?.fallback) {
        // Branded email sent successfully via Resend
        setSent(true);
        toast.success(t("auth.forgotPassword.sentTitle"));
        return;
      }

      // 2. Fallback: Firebase Client SDK (sends via Resend SMTP configured in Firebase Console)
      console.log("[ForgotPassword] Using Firebase fallback");
      await resetPassword(email);
      setSent(true);
      toast.success(t("auth.forgotPassword.sentTitle"));
    } catch (e: any) {
      toast.error(e?.message || t("auth.forgotPassword.errors.generic"));
      console.error("[ForgotPassword]", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full glass-strong border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.forgotPassword.sentTitle")}
          </CardTitle>
          <CardDescription>
            {t("auth.forgotPassword.sentDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.forgotPassword.checkSpam")}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/login")}
            className="w-full gradient-button"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-strong border-white/10">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t("auth.forgotPassword.title")}
        </CardTitle>
        <CardDescription>
          {t("auth.forgotPassword.subtitle")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full gradient-button"
          >
            {isSubmitting
              ? t("auth.forgotPassword.sending")
              : t("auth.forgotPassword.submitButton")}
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
"use client";

/**
 * RegisterForm.tsx
 * Formulario de registro con Firebase Auth.
 * Crea el usuario + documento en Firestore con rol "customer".
 * Incluye campos de teléfono y dirección obligatorios.
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

export function RegisterForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const { signUp, error } = useAuth();
  const router = useRouter();

  // Verificar config de Firebase al montar
  useEffect(() => {
    setConfigError(getFirebaseConfigError());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    // Bloquear si Firebase no está configurado
    const cfgErr = getFirebaseConfigError();
    if (cfgErr) {
      setLocalError(cfgErr);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t("auth.register.errors.passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setLocalError(t("auth.register.errors.passwordTooShort"));
      return;
    }

    if (!phone.trim()) {
      setLocalError(t("auth.register.errors.phoneRequired"));
      return;
    }

    if (!street.trim() || !city.trim() || !zip.trim()) {
      setLocalError(t("auth.register.errors.addressRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({
        email,
        password,
        displayName: name || undefined,
        phone: phone.trim() || undefined,
        address: (street.trim() && city.trim() && zip.trim())
          ? { street: street.trim(), city: city.trim(), zip: zip.trim() }
          : undefined,
      });
      router.push("/dashboard");
    } catch {
      // El error ya se maneja en el hook
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayError = configError || localError || error;

  function getErrorMessage(err: string): string {
    if (err.includes("email-already-in-use"))
      return t("auth.register.errors.emailAlreadyRegistered");
    if (err.includes("weak-password"))
      return t("auth.register.errors.passwordTooWeak");
    if (err.includes("invalid-email"))
      return t("auth.register.errors.invalidEmail");
    if (err.includes("api-key-not-valid"))
      return t("auth.register.errors.firebaseNotConfigured");
    return err;
  }

  return (
    <Card className="w-full max-w-md glass-strong border-white/10 mx-auto">
      <CardHeader className="text-center">
        <Image src="/shine-logo.png" alt="Shine" width={180} height={98} className="mx-auto mb-3 h-16 w-auto sm:h-20 rounded-none" />
        <CardTitle className="text-2xl font-bold">
          {t("auth.register.title")}
        </CardTitle>
        <CardDescription>
          {t("auth.register.subtitle")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {getErrorMessage(displayError)}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.register.nameLabel")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("auth.register.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("auth.register.phoneLabel")}
              <span className="text-red-400 ml-0.5">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("auth.register.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.register.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.register.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-white/10 bg-white/5"
            />
          </div>

          {/* Address section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/80">
              {t("auth.register.addressSection")}
              <span className="text-red-400 ml-0.5">*</span>
            </p>
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="space-y-1">
                <Label htmlFor="street" className="text-xs text-muted-foreground">{t("auth.register.streetLabel")}</Label>
                <Input
                  id="street"
                  type="text"
                  placeholder={t("auth.register.streetPlaceholder")}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  autoComplete="street-address"
                  className="border-white/10 bg-white/5 h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs text-muted-foreground">{t("auth.register.cityLabel")}</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder={t("auth.register.cityPlaceholder")}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    autoComplete="address-level2"
                    className="border-white/10 bg-white/5 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip" className="text-xs text-muted-foreground">{t("auth.register.zipLabel")}</Label>
                  <Input
                    id="zip"
                    type="text"
                    placeholder={t("auth.register.zipPlaceholder")}
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    required
                    autoComplete="postal-code"
                    className="border-white/10 bg-white/5 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.register.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.register.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("auth.register.confirmPasswordLabel")}</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="border-white/10 bg-white/5"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-button"
          >
            {isSubmitting ? t("auth.register.submittingButton") : t("auth.register.submitButton")}
          </Button>
          <SocialLoginButtons mode="register" />
          <p className="text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("auth.register.loginLink")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
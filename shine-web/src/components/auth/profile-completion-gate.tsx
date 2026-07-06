"use client";

/**
 * ProfileCompletionGate.tsx
 * After social login (Google/Facebook/Apple), users may not have
 * phone or address. This gate blocks dashboard access until the user
 * fills in those required fields.
 *
 * When profile is complete → returns null (rest of layout renders normally).
 * When profile is incomplete → renders a full-screen fixed overlay.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, MapPin, CheckCircle } from "lucide-react";

export function ProfileCompletionGate() {
  const { profile, updateProfile } = useAuth();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState(profile?.address?.street || "");
  const [city, setCity] = useState(profile?.address?.city || "");
  const [zip, setZip] = useState(profile?.address?.zip || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // If profile is not loaded yet, show nothing (AuthGuard handles loading state)
  if (!profile) return null;

  // If user already has phone AND address, gate passes — render nothing
  if (profile.phone && profile.address) return null;

  // Profile incomplete — show full-screen blocking overlay
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError(t("auth.completeProfile.errors.phoneRequired"));
      return;
    }
    if (!street.trim() || !city.trim() || !zip.trim()) {
      setError(t("auth.completeProfile.errors.addressRequired"));
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        phone: phone.trim(),
        address: { street: street.trim(), city: city.trim(), zip: zip.trim() },
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || t("auth.completeProfile.errors.saveError"));
    } finally {
      setSaving(false);
    }
  }

  // Success state
  if (saved) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">{t("auth.completeProfile.successTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("auth.completeProfile.successMessage")}</p>
        </div>
      </div>
    );
  }

  // Form state — full-screen fixed overlay blocks everything behind it
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4 overflow-y-auto py-8">
      <div className="max-w-sm w-full space-y-6 my-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{t("auth.completeProfile.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("auth.completeProfile.description")}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="cp-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {t("auth.completeProfile.phoneLabel")}
              <span className="text-red-400">*</span>
            </Label>
            <Input
              id="cp-phone"
              type="tel"
              placeholder={t("auth.completeProfile.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className="border-white/10 bg-white/5"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {t("auth.completeProfile.addressLabel")}
              <span className="text-red-400">*</span>
            </Label>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cp-street" className="text-xs text-muted-foreground">{t("auth.completeProfile.streetLabel")}</Label>
                <Input
                  id="cp-street"
                  type="text"
                  placeholder={t("auth.completeProfile.streetPlaceholder")}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  autoComplete="street-address"
                  className="border-white/10 bg-white/5 h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="cp-city" className="text-xs text-muted-foreground">{t("auth.completeProfile.cityLabel")}</Label>
                  <Input
                    id="cp-city"
                    type="text"
                    placeholder={t("auth.completeProfile.cityPlaceholder")}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    autoComplete="address-level2"
                    className="border-white/10 bg-white/5 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cp-zip" className="text-xs text-muted-foreground">{t("auth.completeProfile.zipLabel")}</Label>
                  <Input
                    id="cp-zip"
                    type="text"
                    placeholder={t("auth.completeProfile.zipPlaceholder")}
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

          <Button
            type="submit"
            disabled={saving}
            className="w-full gradient-button h-11"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.completeProfile.saving")}
              </>
            ) : (
              t("auth.completeProfile.submitButton")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
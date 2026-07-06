"use client";

/**
 * /dashboard/settings — Perfil y configuración del usuario.
 * Hydration-safe: no renderiza datos hasta que el cliente monta.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User, MapPin, Phone } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { profileFormSchema, type ProfileFormValues } from "@/lib/schemas";
import type { Address } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const [clientReady, setClientReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      address: null,
    },
    values: clientReady && profile
      ? {
          displayName: profile.displayName || "",
          phone: profile.phone || "",
          address: profile.address || null,
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  async function handleSubmit(data: ProfileFormValues) {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      // Normalizar: si la dirección está vacía, enviar null
      const hasAddress =
        data.address &&
        (data.address.street || data.address.city || data.address.zip);

      const cleanedAddress: Address | null = hasAddress
        ? {
            street: data.address!.street,
            city: data.address!.city,
            zip: data.address!.zip,
          }
        : null;

      await updateProfile({
        displayName: data.displayName,
        phone: data.phone || null,
        address: cleanedAddress,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || t("dashboard.settings.errorSaving"));
    } finally {
      setIsSaving(false);
    }
  }

  // Pantalla de carga inicial
  if (!clientReady || authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasAddress = profile?.address;
  const wantsAddress = form.watch("address") !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.settings.description")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6 lg:grid-cols-2">
          {/* ── Información personal ── */}
          <Card className="glass-strong border-white/[0.06]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("dashboard.settings.personalInfo")}</CardTitle>
              </div>
              <CardDescription>
                {t("dashboard.settings.personalInfoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email (solo lectura) */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t("dashboard.settings.emailLabel")}
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="border-white/10 bg-white/[0.02] text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground/60">
                  {t("dashboard.settings.emailCantChange")}
                </p>
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Nombre */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dashboard.settings.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("dashboard.settings.namePlaceholder")}
                        className="border-white/10 bg-white/5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      {t("dashboard.settings.phoneLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+53 5 1234567"
                        className="border-white/10 bg-white/5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Dirección ── */}
          <Card className="glass-strong border-white/[0.06]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{t("dashboard.settings.addressLabel")}</CardTitle>
                    <CardDescription>
                      {t("dashboard.settings.addressDescription")}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (wantsAddress) {
                      form.setValue("address", null);
                    } else {
                      form.setValue("address", {
                        street: profile?.address?.street || "",
                        city: profile?.address?.city || "",
                        zip: profile?.address?.zip || "",
                      });
                    }
                  }}
                  className="text-xs text-muted-foreground"
                >
                  {wantsAddress ? t("dashboard.settings.removeAddress") : t("dashboard.settings.addAddress")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {wantsAddress ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.street")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("dashboard.settings.streetPlaceholder")}
                            className="border-white/10 bg-white/5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.city")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("dashboard.settings.cityPlaceholder")}
                              className="border-white/10 bg-white/5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.zipCode")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="10400"
                              className="border-white/10 bg-white/5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.settings.noAddress")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {t("dashboard.settings.noAddressDescription")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Botón guardar (ancho completo) ── */}
          <div className="lg:col-span-2">
            {saveError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                {t("dashboard.settings.profileUpdated")}
              </div>
            )}
            <Button
              type="submit"
              disabled={isSaving}
              className="gradient-button gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("common.saveChanges")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
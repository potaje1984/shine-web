"use client";

/**
 * Admin Settings — Simple profile settings for admin.
 * Reuses the same settings UI as customer dashboard.
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

export default function AdminSettingsPage() {
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

  if (!clientReady || authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const wantsAddress = form.watch("address") !== null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{t("admin.settings.title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("admin.settings.subtitle")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Personal info card */}
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{t("admin.settings.personalInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("dashboard.settings.emailLabel")}</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="border-white/[0.06] bg-white/[0.01] text-muted-foreground text-sm"
                />
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("dashboard.settings.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("dashboard.settings.namePlaceholder")}
                        className="border-white/[0.06] bg-white/[0.02]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5" />
                      {t("dashboard.settings.phoneLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+1 555 1234567"
                        className="border-white/[0.06] bg-white/[0.02]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address card */}
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{t("dashboard.settings.addressLabel")}</CardTitle>
                    <CardDescription className="text-xs">{t("dashboard.settings.addressDescription")}</CardDescription>
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
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.street")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("dashboard.settings.streetPlaceholder")} className="border-white/[0.06] bg-white/[0.02]" />
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
                            <Input {...field} placeholder={t("dashboard.settings.cityPlaceholder")} className="border-white/[0.06] bg-white/[0.02]" />
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
                            <Input {...field} placeholder="33101" className="border-white/[0.06] bg-white/[0.02]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <MapPin className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t("dashboard.settings.noAddress")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          {saveError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              {t("dashboard.settings.profileUpdated")}
            </div>
          )}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full gradient-button gap-2 h-12 text-sm font-semibold"
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
        </form>
      </Form>
    </div>
  );
}
"use client";

/**
 * CleaningOrderForm.tsx
 * Form for creating house cleaning orders (quote-based, no weight).
 */

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Loader2,
  Home,
  Sparkles,
  CalendarIcon,
  Clock,
  Lock,
  Check,
  CreditCard,
  Banknote,
  ClipboardList,
  PaintBucket,
  Truck,
  Hammer,
  MapPin,
} from "lucide-react";

import { cleaningFormSchema, type CleaningFormValues } from "@/lib/schemas";
import {
  CLEANING_TYPES,
  generateTimeSlots,
  formatTimeSlot,
} from "@/lib/constants";
import { useAvailableSlots } from "@/hooks/use-available-slots";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { StripeProvider } from "@/components/payment/stripe-provider";
import { StripeCardInput } from "@/components/payment/stripe-card-input";
import { DeliveryZoneMap } from "./delivery-zone-map";

const CLEANING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  standard: Sparkles,
  deep_clean: PaintBucket,
  move_in: Truck,
  post_construction: Hammer,
};

interface CleaningOrderFormProps {
  onSubmit: (data: CleaningFormValues & { stripePaymentMethodId?: string; stripeSetupIntentId?: string; stripeCustomerId?: string }) => Promise<void>;
  onCancel?: () => void;
  defaultAddress?: { street: string; city: string; zip: string };
  userEmail?: string;
}

export function CleaningOrderForm({ onSubmit, onCancel, defaultAddress, userEmail }: CleaningOrderFormProps) {
  const [clientReady, setClientReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);
  const [savedSetupIntentId, setSavedSetupIntentId] = useState<string | null>(null);
  const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [addressInZone, setAddressInZone] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => { setClientReady(true); }, []);

  const form = useForm<CleaningFormValues>({
    resolver: zodResolver(cleaningFormSchema),
    defaultValues: {
      cleaningType: "standard",
      cleaningDescription: "",
      pickupDate: "",
      pickupTime: "",
      address: defaultAddress
        ? { street: defaultAddress.street, city: defaultAddress.city, zip: defaultAddress.zip }
        : { street: "", city: "", zip: "" },
      paymentMethod: "cash",
      notes: "",
    },
  });

  const watchedType = form.watch("cleaningType");
  const watchedDate = form.watch("pickupDate");
  const watchedTime = form.watch("pickupTime");
  const watchedPayment = form.watch("paymentMethod");

  const { takenSlots, loading: slotsLoading } = useAvailableSlots(watchedDate || null);
  const allSlots = useMemo(() => generateTimeSlots(), []);
  const selectedDate = watchedDate ? new Date(watchedDate + "T12:00:00") : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => { form.setValue("pickupTime", ""); }, [watchedDate, form]);

  async function handleSubmit(data: CleaningFormValues) {
    setSubmitError(null);

    // Block if we know user is out of delivery zone
    if (addressInZone === false) {
      setSubmitError("Tu ubicación está fuera de nuestra zona de entrega. Selecciona una dirección dentro de la zona verde del mapa.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (data.paymentMethod === "card" && savedPaymentMethodId) {
        await onSubmit({ ...data, stripePaymentMethodId: savedPaymentMethodId, stripeSetupIntentId: savedSetupIntentId || undefined, stripeCustomerId: savedCustomerId || undefined });
      } else {
        await onSubmit(data);
      }
    } catch (e: any) {
      setSubmitError(e.message || t("cleaning.form.errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCardSuccess(cardData: { paymentMethodId: string; setupIntentId: string; customerId: string }) {
    setSavedPaymentMethodId(cardData.paymentMethodId);
    setSavedSetupIntentId(cardData.setupIntentId);
    setSavedCustomerId(cardData.customerId);
    setCardSaved(true);
    setCardError(null);
  }

  function handleCardError(error: string) { setCardError(error); }

  useEffect(() => {
    if (watchedPayment === "cash") {
      setCardSaved(false);
      setSavedPaymentMethodId(null);
      setSavedSetupIntentId(null);
      setSavedCustomerId(null);
      setCardError(null);
    }
  }, [watchedPayment]);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    form.setValue("pickupDate", format(date, "yyyy-MM-dd"), { shouldValidate: true });
    setCalendarOpen(false);
  }

  if (!clientReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {submitError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{submitError}</div>
        )}

        {/* ── Delivery Zone Map (TOP - first thing user sees) ── */}
        <div className="space-y-2">
          <FormLabel className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zona de entrega
          </FormLabel>
          <DeliveryZoneMap
            onZoneStatusChange={(inZone) => setAddressInZone(inZone)}
          />
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Home className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">{t("cleaning.form.quoteFlowTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("cleaning.form.quoteFlowDescription")}</p>
            </div>
          </div>
        </div>

        <FormField control={form.control} name="cleaningType" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("cleaning.form.cleaningType")}</FormLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.entries(CLEANING_TYPES) as [string, { label: string; description: string }][]).map(([key, cfg]) => {
                const Icon = CLEANING_ICONS[key] || Home;
                const isSelected = field.value === key;
                return (
                  <button key={key} type="button" onClick={() => field.onChange(key)}
                    className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected ? "border-primary bg-primary/10 text-foreground" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10 hover:bg-white/[0.04]")}>
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", isSelected ? "bg-primary/20" : "bg-white/5")}>
                      <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isSelected && "text-primary")}>{cfg.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{cfg.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cleaningDescription" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />{t("cleaning.form.description")}</FormLabel>
            <FormControl><Textarea {...field} placeholder={t("cleaning.form.descriptionPlaceholder")} className="border-white/10 bg-white/5 min-h-24" maxLength={500} /></FormControl>
            <FormDescription>{t("cleaning.form.descriptionHint")}</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="pickupDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{t("cleaning.form.visitDate")}</FormLabel>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button type="button" variant="outline" className={cn("w-full justify-start border-white/10 bg-white/5 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(new Date(field.value + "T12:00:00"), "EEEE, MMMM d, yyyy", { locale: enUS }) : t("cleaning.form.selectDate")}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={[{ before: today }]} autoFocus />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="pickupTime" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" />{t("cleaning.form.visitTime")}</FormLabel>
            {!watchedDate ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-white/10 rounded-lg">{t("cleaning.form.selectDateFirst")}</p>
            ) : slotsLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">{t("dashboard.orderForm.checkingAvailability")}</span></div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {allSlots.map((slot) => {
                  const isTaken = takenSlots.includes(slot);
                  const isSelected = watchedTime === slot;
                  return (
                    <button key={slot} type="button" disabled={isTaken} onClick={() => form.setValue("pickupTime", slot, { shouldValidate: true })}
                      className={cn("relative flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm transition-all",
                        isTaken ? "cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-muted-foreground/40 opacity-50"
                          : isSelected ? "border-primary bg-primary/15 text-primary font-semibold"
                          : "border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/[0.08]")}>
                      {isTaken ? <Lock className="mb-1 h-3.5 w-3.5" /> : isSelected ? <Check className="mb-1 h-3.5 w-3.5" /> : null}
                      <span className={cn(isTaken && "line-through")}>{formatTimeSlot(slot)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3">
          <FormLabel className="text-base">{t("cleaning.form.serviceAddress")}</FormLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField control={form.control} name="address.street" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("common.street")}</FormLabel>
                <FormControl><Input {...field} placeholder="123 Main St, Apt 4B" className="border-white/10 bg-white/5" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address.city" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.city")}</FormLabel>
                <FormControl><Input {...field} placeholder="Miami" className="border-white/10 bg-white/5" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address.zip" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.zipCode")}</FormLabel>
                <FormControl><Input {...field} placeholder="33101" className="border-white/10 bg-white/5" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* ── Notes ── */}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("dashboard.orderForm.additionalNotes")}</FormLabel>
            <FormControl><Textarea {...field} placeholder="Special instructions..." className="border-white/10 bg-white/5 min-h-20" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3">
          <FormLabel className="text-base">{t("payment.methodLabel")}</FormLabel>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => form.setValue("paymentMethod", "cash", { shouldValidate: true })}
              className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                watchedPayment === "cash" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10")}>
              <Banknote className="h-6 w-6" /><span className="text-sm font-medium">{t("payment.cash")}</span>
            </button>
            <button type="button" onClick={() => form.setValue("paymentMethod", "card", { shouldValidate: true })}
              className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                watchedPayment === "card" ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10")}>
              <CreditCard className="h-6 w-6" /><span className="text-sm font-medium">{t("payment.card")}</span>
            </button>
          </div>
          {watchedPayment === "card" && cardSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400"><Check className="h-4 w-4" />{t("payment.cardSaved")}</div>
          )}
          {cardError && (<div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{cardError}</div>)}
          {watchedPayment === "card" && !cardSaved && (
            <StripeProvider><StripeCardInput userEmail={userEmail} onSuccess={handleCardSuccess} onError={handleCardError} /></StripeProvider>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (<Button type="button" variant="ghost" onClick={onCancel} className="border-white/10">{t("common.cancel")}</Button>)}
          <Button type="submit" disabled={isSubmitting || (watchedPayment === "card" && !cardSaved)} className="gradient-button gap-2">
            {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />{t("cleaning.form.creating")}</>) : (<><Home className="h-4 w-4" />{t("cleaning.form.submit")}</>)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
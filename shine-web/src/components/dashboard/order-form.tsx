"use client";

/**
 * OrderForm.tsx
 * Form for creating new laundry orders.
 *
 * Business model: charge per pound (minimum 20 lbs).
 * Calendar system with time slots that block
 * when another customer has already booked that slot.
 *
 * Uses react-hook-form + Zod for validation.
 * Hydration-safe: does not render until the client mounts.
 */

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Loader2,
  Sparkles,
  Scale,
  CalendarIcon,
  Clock,
  Lock,
  Check,
  CreditCard,
  Banknote,
} from "lucide-react";

import { orderFormSchema, type OrderFormValues } from "@/lib/schemas";
import {
  SERVICE_TYPE_CONFIG,
  MIN_WEIGHT_LBS,
  generateTimeSlots,
  formatTimeSlot,
} from "@/lib/constants";
import { useAvailableSlots } from "@/hooks/use-available-slots";
import type { ServiceType } from "@/lib/types";

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

interface OrderFormProps {
  onSubmit: (data: OrderFormValues & { stripePaymentMethodId?: string; stripeSetupIntentId?: string; stripeCustomerId?: string }) => Promise<void>;
  onCancel?: () => void;
  defaultAddress?: { street: string; city: string; zip: string };
  userEmail?: string;
}

export function OrderForm({ onSubmit, onCancel, defaultAddress, userEmail }: OrderFormProps) {
  const [clientReady, setClientReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);
  const [savedSetupIntentId, setSavedSetupIntentId] = useState<string | null>(null);
  const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setClientReady(true);
  }, []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      serviceType: "wash_fold",
      weight: MIN_WEIGHT_LBS,
      pickupDate: "",
      pickupTime: "",
      address: defaultAddress
        ? { street: defaultAddress.street, city: defaultAddress.city, zip: defaultAddress.zip }
        : { street: "", city: "", zip: "" },
      paymentMethod: "cash",
      notes: "",
    },
  });

  const watchedService = form.watch("serviceType");
  const watchedWeight = form.watch("weight");
  const watchedDate = form.watch("pickupDate");
  const watchedTime = form.watch("pickupTime");
  const watchedPayment = form.watch("paymentMethod");

  const serviceConfig = SERVICE_TYPE_CONFIG[watchedService as ServiceType];
  const pricePerPound = serviceConfig?.pricePerPound ?? 1.5;
  const total = (watchedWeight || 0) * pricePerPound;

  // Available time slots (real-time)
  const { takenSlots, loading: slotsLoading } = useAvailableSlots(
    watchedDate || null
  );

  const allSlots = useMemo(() => generateTimeSlots(), []);

  // Selected date as Date for the Calendar
  const selectedDate = watchedDate ? new Date(watchedDate + "T12:00:00") : undefined;

  // Minimum date: today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear the time slot if the date changes
  useEffect(() => {
    form.setValue("pickupTime", "");
  }, [watchedDate, form]);

  async function handleSubmit(data: OrderFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // If card payment, include stripe data
      if (data.paymentMethod === "card" && savedPaymentMethodId) {
        await onSubmit({
          ...data,
          stripePaymentMethodId: savedPaymentMethodId,
          stripeSetupIntentId: savedSetupIntentId || undefined,
          stripeCustomerId: savedCustomerId || undefined,
        });
      } else {
        await onSubmit(data);
      }
    } catch (e: any) {
      setSubmitError(e.message || t("dashboard.orderForm.errorCreating"));
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

  function handleCardError(error: string) {
    setCardError(error);
  }

  // Reset card state when switching payment method
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
    const formatted = format(date, "yyyy-MM-dd");
    form.setValue("pickupDate", formatted, { shouldValidate: true });
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
        {/* General error */}
        {submitError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {submitError}
          </div>
        )}

        {/* ── Service type ── */}
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dashboard.orderForm.serviceType")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue placeholder={t("dashboard.orderForm.selectService")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(SERVICE_TYPE_CONFIG) as [ServiceType, (typeof SERVICE_TYPE_CONFIG)[ServiceType]][]).map(
                    ([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cfg.label}</span>
                          <span className="text-xs text-muted-foreground">
                            — ${cfg.pricePerPound.toFixed(2)}{t("common.perLb")}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {serviceConfig?.description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Weight in pounds ── */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                {t("dashboard.orderForm.weight")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={MIN_WEIGHT_LBS}
                  max={200}
                  placeholder={`${MIN_WEIGHT_LBS}`}
                  className="border-white/10 bg-white/5 max-w-[200px]"
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.orderForm.minWeight", { min: MIN_WEIGHT_LBS })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Price summary ── */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t("dashboard.orderForm.pricePerLb")}</p>
            <p className="mt-1 text-lg font-bold">
              ${pricePerPound.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t("dashboard.orderForm.weight").split(" (")[0]}</p>
            <p className="mt-1 text-lg font-bold">
              {watchedWeight || 0} lbs
            </p>
          </div>
          <div className="text-center rounded-lg bg-emerald-500/10 p-2">
            <p className="text-xs text-emerald-400/70">{t("dashboard.orderForm.totalLabel")}</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Pickup date (Calendar) ── */}
        <FormField
          control={form.control}
          name="pickupDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t("dashboard.orderForm.pickupDate")}
              </FormLabel>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start border-white/10 bg-white/5 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? format(new Date(field.value + "T12:00:00"), "EEEE, MMMM d, yyyy", { locale: enUS })
                        : t("dashboard.orderForm.selectDate")}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={[{ before: today }]}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Pickup time (time slots) ── */}
        <FormField
          control={form.control}
          name="pickupTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("dashboard.orderForm.pickupTime")}
              </FormLabel>

              {!watchedDate ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-white/10 rounded-lg">
                  {t("dashboard.orderForm.selectDateFirst")}
                </p>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {t("dashboard.orderForm.checkingAvailability")}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {allSlots.map((slot) => {
                    const isTaken = takenSlots.includes(slot);
                    const isSelected = watchedTime === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isTaken}
                        onClick={() =>
                          form.setValue("pickupTime", slot, {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm transition-all",
                          isTaken
                            ? "cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-muted-foreground/40 opacity-50"
                            : isSelected
                              ? "border-primary bg-primary/15 text-primary font-semibold"
                              : "border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/[0.08]"
                        )}
                      >
                        {isTaken ? (
                          <Lock className="mb-1 h-3.5 w-3.5" />
                        ) : isSelected ? (
                          <Check className="mb-1 h-3.5 w-3.5" />
                        ) : null}
                        <span className={cn(isTaken && "line-through")}>
                          {formatTimeSlot(slot)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {takenSlots.length > 0 && watchedDate && (
                <FormDescription>
                  {t("dashboard.orderForm.slotsTaken", { taken: takenSlots.length, total: allSlots.length })}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Pickup address ── */}
        <div className="space-y-3">
          <FormLabel className="text-base">{t("dashboard.orderForm.pickupAddress")}</FormLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("common.street")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dashboard.orderForm.streetPlaceholder")}
                      className="border-white/10 bg-white/5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.city")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dashboard.orderForm.cityPlaceholder")}
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
                      placeholder={t("dashboard.orderForm.zipPlaceholder")}
                      className="border-white/10 bg-white/5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Notes ── */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dashboard.orderForm.additionalNotes")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("dashboard.orderForm.notesPlaceholder")}
                  className="border-white/10 bg-white/5 min-h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Payment method ── */}
        <div className="space-y-3">
          <FormLabel className="text-base">{t("payment.methodLabel")}</FormLabel>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => form.setValue("paymentMethod", "cash", { shouldValidate: true })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                watchedPayment === "cash"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10"
              )}
            >
              <Banknote className="h-6 w-6" />
              <span className="text-sm font-medium">{t("payment.cash")}</span>
            </button>
            <button
              type="button"
              onClick={() => form.setValue("paymentMethod", "card", { shouldValidate: true })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                watchedPayment === "card"
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10"
              )}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-medium">{t("payment.card")}</span>
            </button>
          </div>

          {/* Card saved confirmation */}
          {watchedPayment === "card" && cardSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              <Check className="h-4 w-4" />
              {t("payment.cardSaved")}
            </div>
          )}

          {/* Card error */}
          {cardError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {cardError}
            </div>
          )}

          {/* Stripe Card Input (only when card selected and not saved) */}
          {watchedPayment === "card" && !cardSaved && (
            <StripeProvider>
              <StripeCardInput
                userEmail={userEmail}
                onSuccess={handleCardSuccess}
                onError={handleCardError}
              />
            </StripeProvider>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="border-white/10"
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || (watchedPayment === "card" && !cardSaved)}
            className="gradient-button gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("dashboard.orderForm.creatingOrder")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("dashboard.orderForm.createOrder")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
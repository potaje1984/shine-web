"use client";

/**
 * StripeCardInput.tsx
 * Componente de tarjeta Stripe con campos individuales para mejor
 * diseño responsive en móvil.
 *
 * Flujo: crea Customer + SetupIntent → confirma tarjeta → devuelve
 * customerId + paymentMethodId + setupIntentId
 */

import { useState } from "react";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface StripeCardInputProps {
  userEmail?: string;
  onSuccess: (data: { paymentMethodId: string; setupIntentId: string; customerId: string }) => void;
  onError: (error: string) => void;
}

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "transparent",
      "::placeholder": {
        color: "#71717a",
      },
    },
  } as React.CSSProperties,
};

const inputWrapper =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30";

export function StripeCardInput({ userEmail, onSuccess, onError }: StripeCardInputProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!stripe || !elements) {
      onError(t("payment.stripeNotReady"));
      return;
    }

    setLoading(true);

    try {
      // 1. Crear SetupIntent + Customer desde nuestro backend
      const res = await fetch("/api/stripe/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Failed to create setup intent");
      }

      // 2. Confirmar el SetupIntent con los campos individuales
      const { setupIntent, error } = await stripe.confirmCardSetup(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement)!,
          },
        }
      );

      if (error) {
        onError(error.message || t("payment.cardError"));
        return;
      }

      if (setupIntent && setupIntent.payment_method) {
        onSuccess({
          paymentMethodId: setupIntent.payment_method as string,
          setupIntentId: setupIntent.id,
          customerId: data.customerId,
        });
      } else {
        onError(t("payment.cardError"));
      }
    } catch (err: any) {
      onError(err.message || t("payment.cardError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>{t("payment.noChargeUntilPickup")}</p>
      </div>

      {/* Card fields — grid responsive */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {t("payment.cardDetails")}
        </div>

        {/* Número de tarjeta — full width */}
        <div className={inputWrapper}>
          <CardNumberElement options={elementOptions} />
        </div>

        {/* Expiración y CVC — lado a lado en móvil */}
        <div className="grid grid-cols-2 gap-3">
          <div className={inputWrapper}>
            <CardExpiryElement options={elementOptions} />
          </div>
          <div className={inputWrapper}>
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      {/* Save card button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full gap-2 gradient-button h-11"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("payment.savingCard")}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            {t("payment.saveCard")}
          </>
        )}
      </Button>
    </div>
  );
}
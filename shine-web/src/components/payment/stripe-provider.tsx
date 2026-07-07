"use client";

/**
 * StripeProvider.tsx
 * Wrapper que inicializa Stripe con la publishable key
 * inyectada via window.__STRIPE_PK__ desde layout.tsx.
 */

import { useMemo } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

function getStripeKey(): string {
  if (typeof window === "undefined") return "";
  const w = window as unknown as { __STRIPE_PK__?: string };
  return w.__STRIPE_PK__ || "";
}

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const stripePromise = useMemo(() => {
    const key = getStripeKey();
    if (!key) return null;
    return loadStripe(key);
  }, []);

  if (!stripePromise) return null;

  const options: StripeElementsOptions = {
    fonts: [
      {
        cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
      },
    ],
  };

  return <Elements stripe={stripePromise} options={options}>{children}</Elements>;
}
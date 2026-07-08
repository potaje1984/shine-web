import { LaundryNav } from "@/components/landing/laundry-nav";
import { LaundryHero } from "@/components/landing/laundry-hero";
import { LaundryServices } from "@/components/landing/laundry-services";
import { LaundryHowItWorks } from "@/components/landing/laundry-how";
import { CleaningHowItWorks } from "@/components/landing/cleaning-how";
import { PaymentExplanation } from "@/components/landing/payment-explanation";
import { LaundryCTA } from "@/components/landing/laundry-cta";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LaundryNav />
      <main className="flex-1">
        <LaundryHero />
        <LaundryServices />
        <LaundryHowItWorks />
        <CleaningHowItWorks />
        <PaymentExplanation />
        <LaundryCTA />
      </main>

      <footer className="mt-auto border-t border-white/[0.06] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/shine-logo.png" alt="Shine" width={80} height={44} className="h-5 w-auto rounded-none" />
            <span className="font-sans text-sm font-semibold">
              Shine
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5">v2.0</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#services" className="transition-colors hover:text-foreground">
              Servicios
            </a>
            <a href="#cleaning-how" className="transition-colors hover:text-foreground">
              Limpieza
            </a>
            <a href="#payment" className="transition-colors hover:text-foreground">
              Pagos
            </a>
          </div>
          <span>&copy; 2026 Shine &middot; Hecho con cuidado</span>
        </div>
      </footer>
    </div>
  );
}
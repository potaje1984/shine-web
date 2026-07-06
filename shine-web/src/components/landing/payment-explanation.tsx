"use client";

/**
 * PaymentExplanation.tsx
 * Didactic explanation of how card payments work for both services.
 * Includes visual flow diagrams showing each stage of the payment process.
 */

import { motion } from "framer-motion";
import { Shield, Lock, Check, AlertCircle, Smartphone, Clock, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type StepData = { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; detail?: string };

export function PaymentExplanation() {
  const { t } = useTranslation();

  const laundrySteps: StepData[] = [
    { title: t("landing.paymentExplanation.laundryStep1.title"), desc: t("landing.paymentExplanation.laundryStep1.description"), icon: Lock, detail: t("landing.paymentExplanation.laundryStep1.detail") },
    { title: t("landing.paymentExplanation.laundryStep2.title"), desc: t("landing.paymentExplanation.laundryStep2.description"), icon: User, detail: t("landing.paymentExplanation.laundryStep2.detail") },
    { title: t("landing.paymentExplanation.laundryStep3.title"), desc: t("landing.paymentExplanation.laundryStep3.description"), icon: Check, detail: t("landing.paymentExplanation.laundryStep3.detail") },
  ];

  const cleaningSteps: StepData[] = [
    { title: t("landing.paymentExplanation.cleaningStep1.title"), desc: t("landing.paymentExplanation.cleaningStep1.description"), icon: Lock, detail: t("landing.paymentExplanation.cleaningStep1.detail") },
    { title: t("landing.paymentExplanation.cleaningStep2.title"), desc: t("landing.paymentExplanation.cleaningStep2.description"), icon: AlertCircle, detail: t("landing.paymentExplanation.cleaningStep2.detail") },
    { title: t("landing.paymentExplanation.cleaningStep3.title"), desc: t("landing.paymentExplanation.cleaningStep3.description"), icon: Check, detail: t("landing.paymentExplanation.cleaningStep3.detail") },
  ];

  return (
    <section id="payment" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {t("landing.paymentExplanation.sectionTitle")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold sm:text-3xl md:text-5xl">
            {t("landing.paymentExplanation.sectionSubtitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("landing.paymentExplanation.sectionDescription")}
          </p>
        </motion.div>

        {/* Why we save cards section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 glass rounded-2xl border border-white/[0.06] p-5 sm:p-7"
        >
          <h3 className="text-base font-semibold mb-4 text-center">
            {t("landing.paymentExplanation.whySaveTitle")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Smartphone, title: t("landing.paymentExplanation.whySave1.title"), desc: t("landing.paymentExplanation.whySave1.desc"), color: "text-cyan-400 bg-cyan-500/15" },
              { icon: Clock, title: t("landing.paymentExplanation.whySave2.title"), desc: t("landing.paymentExplanation.whySave2.desc"), color: "text-purple-400 bg-purple-500/15" },
              { icon: Shield, title: t("landing.paymentExplanation.whySave3.title"), desc: t("landing.paymentExplanation.whySave3.desc"), color: "text-emerald-400 bg-emerald-500/15" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Two-column: Laundry + Cleaning payment flows */}
        <div className="grid gap-8 md:grid-cols-2">
          <PaymentFlowCard
            title={t("landing.paymentExplanation.laundryTitle")}
            steps={laundrySteps}
            accentColor="purple"
            diagram={<LaundryPaymentDiagram />}
          />
          <PaymentFlowCard
            title={t("landing.paymentExplanation.cleaningTitle")}
            steps={cleaningSteps}
            accentColor="cyan"
            diagram={<CleaningPaymentDiagram />}
          />
        </div>

        {/* Stripe security note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
        >
          <Shield className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">
              {t("landing.paymentExplanation.securityBadge")}
            </p>
            <p className="mt-1 text-sm text-foreground/90 leading-relaxed">
              {t("landing.paymentExplanation.secureNote")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Payment Flow Card ─── */

function PaymentFlowCard({ title, steps, accentColor, diagram }: {
  title: string; steps: StepData[]; accentColor: "purple" | "cyan"; diagram: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isPurple = accentColor === "purple";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-2xl p-6 ${isPurple ? "neon-border" : "border border-cyan-500/20"}`}
    >
      <h3 className={`text-lg font-semibold ${isPurple ? "neon-text" : "text-cyan-400"}`}>{title}</h3>

      {/* Steps with detail text */}
      <div className="mt-5 space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isPurple ? "bg-purple-500/15" : "bg-cyan-500/15"}`}>
                <Icon className={`h-4 w-4 ${isPurple ? "text-purple-400" : "text-cyan-400"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isPurple ? "bg-purple-500/15 text-purple-300" : "bg-cyan-500/15 text-cyan-300"}`}>
                    {t("landing.paymentExplanation.phaseLabel")} {idx + 1}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                {step.detail && (
                  <p className="mt-1.5 text-[11px] text-foreground/50 leading-relaxed border-t border-white/[0.06] pt-1.5">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagram */}
      <div className="mt-6 pt-5 border-t border-white/[0.06]">{diagram}</div>
    </motion.div>
  );
}

/* ─── Laundry Payment Flow Diagram (SVG) ─── */

function LaundryPaymentDiagram() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-3">{t("diagram.paymentFlow")} — {t("diagram.laundryService")}</p>

      {/* Desktop SVG */}
      <div className="hidden sm:block">
        <svg viewBox="0 0 420 200" className="w-full" fill="none">
          {/* Row 1: Customer saves card */}
          <rect x="10" y="10" width="110" height="50" rx="10" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
          <circle cx="27" cy="29" r="6" fill="rgba(168,85,247,0.3)" />
          <text x="27" y="32" textAnchor="middle" fill="rgba(168,85,247,1)" fontSize="8">👤</text>
          <text x="70" y="32" textAnchor="middle" fill="rgba(168,85,247,0.9)" fontSize="8" fontWeight="600">{t("diagram.customer")}</text>
          <text x="70" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.entersCard")}</text>

          <line x1="122" y1="35" x2="148" y2="35" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="148,31 156,35 148,39" fill="rgba(168,85,247,0.25)" />

          <rect x="158" y="10" width="110" height="50" rx="10" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.2)" strokeWidth="1" />
          <circle cx="175" cy="29" r="6" fill="rgba(168,85,247,0.25)" />
          <text x="175" y="32" textAnchor="middle" fill="rgba(168,85,247,0.8)" fontSize="8">🏛</text>
          <text x="218" y="32" textAnchor="middle" fill="rgba(168,85,247,0.7)" fontSize="8" fontWeight="600">Stripe</text>
          <text x="218" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.savesToken")}</text>

          <line x1="270" y1="35" x2="296" y2="35" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="296,31 304,35 296,39" fill="rgba(168,85,247,0.25)" />

          <rect x="306" y="10" width="110" height="50" rx="10" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
          <circle cx="323" cy="29" r="6" fill="rgba(16,185,129,0.25)" />
          <text x="323" y="32" textAnchor="middle" fill="rgba(16,185,129,1)" fontSize="8">✓</text>
          <text x="365" y="32" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontWeight="600">{t("diagram.cardSaved")}</text>
          <text x="365" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.noChargeYet")}</text>

          {/* Vertical connector */}
          <line x1="210" y1="62" x2="210" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 2" />
          <polygon points="206,76 210,82 214,76" fill="rgba(255,255,255,0.1)" />

          {/* Row 2: Pickup + Weigh */}
          <rect x="30" y="84" width="160" height="50" rx="10" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />
          <circle cx="47" cy="103" r="6" fill="rgba(168,85,247,0.25)" />
          <text x="47" y="106" textAnchor="middle" fill="rgba(168,85,247,0.8)" fontSize="8">👤</text>
          <text x="118" y="106" textAnchor="middle" fill="rgba(168,85,247,0.7)" fontSize="8" fontWeight="600">{t("diagram.associatePickup")}</text>
          <text x="118" y="122" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.weighsClothes")}</text>

          <line x1="192" y1="109" x2="218" y2="109" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="218,105 226,109 218,113" fill="rgba(168,85,247,0.25)" />

          <rect x="228" y="84" width="170" height="50" rx="10" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />
          <circle cx="245" cy="103" r="6" fill="rgba(168,85,247,0.25)" />
          <text x="245" y="106" textAnchor="middle" fill="rgba(168,85,247,0.8)" fontSize="8">💳</text>
          <text x="320" y="106" textAnchor="middle" fill="rgba(168,85,247,0.7)" fontSize="8" fontWeight="600">{t("diagram.adminConfirm")}</text>
          <text x="320" y="122" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.confirmsWeight")}</text>

          {/* Vertical connector */}
          <line x1="210" y1="136" x2="210" y2="152" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 2" />
          <polygon points="206,150 210,156 214,150" fill="rgba(255,255,255,0.1)" />

          {/* Row 3: Charge */}
          <rect x="10" y="158" width="140" height="36" rx="10" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
          <circle cx="27" cy="176" r="6" fill="rgba(168,85,247,0.3)" />
          <text x="27" y="179" textAnchor="middle" fill="rgba(168,85,247,1)" fontSize="8">$</text>
          <text x="90" y="178" textAnchor="middle" fill="rgba(168,85,247,1)" fontSize="8" fontWeight="700">{t("diagram.shineCharges")} {t("diagram.exactAmount")}</text>

          <line x1="152" y1="176" x2="178" y2="176" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="178,172 186,176 178,180" fill="rgba(168,85,247,0.35)" />

          <rect x="188" y="158" width="230" height="36" rx="10" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <circle cx="205" cy="176" r="6" fill="rgba(16,185,129,0.25)" />
          <text x="205" y="179" textAnchor="middle" fill="rgba(16,185,129,1)" fontSize="8">✓</text>
          <text x="310" y="178" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontWeight="600">{t("diagram.paymentConfirmed")} — {t("diagram.onlyRealWeight")}</text>
        </svg>
      </div>

      {/* Mobile simplified */}
      <div className="space-y-2 sm:hidden">
        {[
          { label: t("diagram.customer"), sub: t("diagram.entersCard"), color: "purple" },
          { label: "Stripe", sub: t("diagram.savesToken"), color: "purple" },
          { label: t("diagram.cardSaved"), sub: t("diagram.noChargeYet"), color: "emerald" },
          { label: t("diagram.associatePickup"), sub: t("diagram.weighsClothes"), color: "purple" },
          { label: t("diagram.adminConfirm"), sub: t("diagram.confirmsWeight"), color: "purple" },
          { label: t("diagram.shineCharges"), sub: t("diagram.exactAmount"), color: "purple" },
          { label: t("diagram.paymentConfirmed"), sub: t("diagram.onlyRealWeight"), color: "emerald" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : "bg-purple-400"}`} />
            <span className="text-[11px] font-medium text-foreground/80">{item.label}</span>
            <span className="text-[10px] text-muted-foreground">— {item.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Cleaning Payment Flow Diagram (SVG) ─── */

function CleaningPaymentDiagram() {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-3">{t("diagram.paymentFlow")} — {t("diagram.cleaningService")}</p>

      {/* Desktop SVG */}
      <div className="hidden sm:block">
        <svg viewBox="0 0 420 200" className="w-full" fill="none">
          {/* Row 1: Customer saves card */}
          <rect x="10" y="10" width="110" height="50" rx="10" fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
          <circle cx="27" cy="29" r="6" fill="rgba(34,211,238,0.3)" />
          <text x="27" y="32" textAnchor="middle" fill="rgba(34,211,238,1)" fontSize="8">👤</text>
          <text x="70" y="32" textAnchor="middle" fill="rgba(34,211,238,0.9)" fontSize="8" fontWeight="600">{t("diagram.customer")}</text>
          <text x="70" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.savesCard")}</text>

          <line x1="122" y1="35" x2="148" y2="35" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="148,31 156,35 148,39" fill="rgba(34,211,238,0.25)" />

          <rect x="158" y="10" width="110" height="50" rx="10" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
          <circle cx="175" cy="29" r="6" fill="rgba(34,211,238,0.25)" />
          <text x="175" y="32" textAnchor="middle" fill="rgba(34,211,238,0.8)" fontSize="8">🏛</text>
          <text x="218" y="32" textAnchor="middle" fill="rgba(34,211,238,0.7)" fontSize="8" fontWeight="600">Stripe</text>
          <text x="218" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.savesToken")}</text>

          <line x1="270" y1="35" x2="296" y2="35" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="296,31 304,35 296,39" fill="rgba(34,211,238,0.25)" />

          <rect x="306" y="10" width="110" height="50" rx="10" fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
          <circle cx="323" cy="29" r="6" fill="rgba(16,185,129,0.25)" />
          <text x="323" y="32" textAnchor="middle" fill="rgba(16,185,129,1)" fontSize="8">✓</text>
          <text x="365" y="32" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontWeight="600">{t("diagram.cardSaved")}</text>
          <text x="365" y="48" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.noChargeUntilQuote")}</text>

          {/* Vertical connector */}
          <line x1="210" y1="62" x2="210" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 2" />
          <polygon points="206,76 210,82 214,76" fill="rgba(255,255,255,0.1)" />

          {/* Row 2: Associate visits + quotes */}
          <rect x="30" y="84" width="160" height="50" rx="10" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.25)" strokeWidth="1" />
          <circle cx="47" cy="103" r="6" fill="rgba(245,158,11,0.25)" />
          <text x="47" y="106" textAnchor="middle" fill="rgba(245,158,11,0.8)" fontSize="8">👤</text>
          <text x="118" y="106" textAnchor="middle" fill="rgba(245,158,11,0.9)" fontSize="8" fontWeight="600">{t("diagram.associateVisit")}</text>
          <text x="118" y="122" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.evaluatesAndQuotes")}</text>

          <line x1="192" y1="109" x2="218" y2="109" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="218,105 226,109 218,113" fill="rgba(245,158,11,0.25)" />

          <rect x="228" y="84" width="170" height="50" rx="10" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
          <circle cx="245" cy="103" r="6" fill="rgba(59,130,246,0.25)" />
          <text x="245" y="106" textAnchor="middle" fill="rgba(59,130,246,0.8)" fontSize="8">📱</text>
          <text x="320" y="106" textAnchor="middle" fill="rgba(59,130,246,0.9)" fontSize="8" fontWeight="600">{t("diagram.customerReceives")}</text>
          <text x="320" y="122" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">{t("diagram.reviewsAndAccepts")}</text>

          {/* Vertical connector */}
          <line x1="210" y1="136" x2="210" y2="152" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 2" />
          <polygon points="206,150 210,156 214,150" fill="rgba(255,255,255,0.1)" />

          {/* Row 3: Charge + Clean */}
          <rect x="10" y="158" width="140" height="36" rx="10" fill="rgba(34,211,238,0.2)" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
          <circle cx="27" cy="176" r="6" fill="rgba(34,211,238,0.3)" />
          <text x="27" y="179" textAnchor="middle" fill="rgba(34,211,238,1)" fontSize="8">$</text>
          <text x="90" y="178" textAnchor="middle" fill="rgba(34,211,238,1)" fontSize="8" fontWeight="700">{t("diagram.shineCharges")} {t("diagram.agreedAmount")}</text>

          <line x1="152" y1="176" x2="178" y2="176" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="178,172 186,176 178,180" fill="rgba(34,211,238,0.35)" />

          <rect x="188" y="158" width="230" height="36" rx="10" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <circle cx="205" cy="176" r="6" fill="rgba(16,185,129,0.25)" />
          <text x="205" y="179" textAnchor="middle" fill="rgba(16,185,129,1)" fontSize="8">✓</text>
          <text x="310" y="178" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontWeight="600">{t("diagram.cleaningDone")} — {t("diagram.onlyPayAfterAccept")}</text>
        </svg>
      </div>

      {/* Mobile simplified */}
      <div className="space-y-2 sm:hidden">
        {[
          { label: t("diagram.customer"), sub: t("diagram.savesCard"), color: "cyan" },
          { label: "Stripe", sub: t("diagram.savesToken"), color: "cyan" },
          { label: t("diagram.cardSaved"), sub: t("diagram.noChargeUntilQuote"), color: "emerald" },
          { label: t("diagram.associateVisit"), sub: t("diagram.evaluatesAndQuotes"), color: "amber" },
          { label: t("diagram.customerReceives"), sub: t("diagram.reviewsAndAccepts"), color: "blue" },
          { label: t("diagram.shineCharges"), sub: t("diagram.agreedAmount"), color: "cyan" },
          { label: t("diagram.cleaningDone"), sub: t("diagram.onlyPayAfterAccept"), color: "emerald" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : item.color === "amber" ? "bg-amber-400" : item.color === "blue" ? "bg-blue-400" : "bg-cyan-400"}`} />
            <span className="text-[11px] font-medium text-foreground/80">{item.label}</span>
            <span className="text-[10px] text-muted-foreground">— {item.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { CalendarClock, Truck, Sparkles, PackageCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function LaundryHowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: CalendarClock,
      title: t("landing.howItWorks.step1.title"),
      desc: t("landing.howItWorks.step1.description"),
    },
    {
      icon: Truck,
      title: t("landing.howItWorks.step2.title"),
      desc: t("landing.howItWorks.step2.description"),
    },
    {
      icon: Sparkles,
      title: t("landing.howItWorks.step3.title"),
      desc: t("landing.howItWorks.step3.description"),
    },
    {
      icon: PackageCheck,
      title: t("landing.howItWorks.step4.title"),
      desc: t("landing.howItWorks.step4.description"),
    },
  ];

  return (
    <section id="how" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {t("landing.howItWorks.sectionTitle")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold sm:text-3xl md:text-5xl">
            {t("landing.howItWorks.sectionSubtitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("landing.howItWorks.sectionDescription")}
          </p>
        </motion.div>

        <div className="relative grid gap-6 md:grid-cols-4">
          {/* Línea conectora decorativa (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(270 90% 65% / 0.4), hsl(190 95% 55% / 0.4), transparent)",
            }}
          />

          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass relative rounded-2xl p-6 text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-sans text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
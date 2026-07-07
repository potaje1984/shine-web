"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export function LaundryCTA() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="glass-strong relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-6 text-center sm:p-10 md:p-16"
      >
        {/* Glow decorativo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, hsl(190 95% 55%), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-40 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, hsl(270 90% 60%), transparent 70%)",
          }}
        />

        <div className="relative">
          <h2 className="font-sans text-2xl font-bold sm:text-3xl md:text-5xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            {t("landing.cta.description")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="gradient-button group inline-flex items-center gap-2 text-base"
            >
              {t("landing.cta.ctaButton")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="tel:+525500000000"
              className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-all hover:border-white/20"
            >
              <Phone className="h-4 w-4 text-accent" />
              {t("landing.cta.callButton")}
            </a>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            {t("landing.cta.footer")}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
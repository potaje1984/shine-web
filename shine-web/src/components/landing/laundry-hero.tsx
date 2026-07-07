"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

export function LaundryHero() {
  const { t } = useTranslation();

  const stats = [
    { value: "24h", label: t("landing.hero.expressDelivery") },
    { value: "+5k", label: t("landing.hero.happyClients") },
    { value: "4.9★", label: t("landing.hero.rating") },
  ];

  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 md:pt-32 md:pb-28">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(270 90% 60%), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Logo grande centrado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Image
            src="/shine-logo.png"
            alt="Shine"
            width={220}
            height={120}
            className="mx-auto w-40 h-auto sm:w-52 md:w-60 rounded-none"
            priority
          />
        </motion.div>

        {/* Badge superior */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground/80">
            {t("landing.hero.badge")}
          </span>
        </motion.div>

        {/* Título principal */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 font-sans text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl"
        >
          {t("landing.hero.title")}
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
        >
          {t("landing.hero.subtitle")}
        </motion.p>

        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register"
            className="gradient-button group inline-flex items-center gap-2 text-base"
          >
            {t("landing.hero.cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how"
            className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-all hover:border-white/20"
          >
            <Star className="h-4 w-4 text-accent" />
            {t("landing.hero.howItWorks")}
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3 sm:mt-16 sm:gap-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass rounded-2xl px-4 py-5 text-center"
            >
              <div className="font-sans text-xl font-bold neon-text sm:text-2xl md:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
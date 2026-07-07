"use client";

import { motion } from "framer-motion";
import { Scale, Sparkles, ArrowRight, Check, Home } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

type Service = {
  icon: typeof Scale;
  title: string;
  desc: string;
  price: string;
  unit: string;
  features: string[];
  highlight?: boolean;
  accent: string;
  glow: string;
  badge?: string;
};

export function LaundryServices() {
  const { t, tArray } = useTranslation();

  const services: Service[] = [
    {
      icon: Scale,
      title: t("landing.services.washByWeight.title"),
      desc: t("landing.services.washByWeight.description"),
      price: "$1.50",
      unit: t("common.perLb"),
      features: tArray("landing.services.washByWeight.features"),
      accent: "from-purple-500/20 to-purple-500/5",
      glow: "hover:shadow-[0_0_32px_-4px_rgba(168,85,247,0.45)]",
    },
    {
      icon: Sparkles,
      title: t("landing.services.dryClean.title"),
      desc: t("landing.services.dryClean.description"),
      price: "$3.00",
      unit: t("common.perLb"),
      features: tArray("landing.services.dryClean.features"),
      highlight: true,
      accent: "from-cyan-500/20 to-cyan-500/5",
      glow: "hover:shadow-[0_0_40px_-4px_rgba(34,211,238,0.55)]",
    },
    {
      icon: Home,
      title: t("landing.services.houseCleaning.title"),
      desc: t("landing.services.houseCleaning.description"),
      price: t("landing.services.houseCleaning.quoteBased"),
      unit: "",
      features: tArray("landing.services.houseCleaning.features"),
      accent: "from-emerald-500/20 to-emerald-500/5",
      glow: "hover:shadow-[0_0_32px_-4px_rgba(16,185,129,0.45)]",
      badge: "NEW",
    },
  ];

  return (
    <section id="services" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {t("landing.services.sectionTitle")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold sm:text-3xl md:text-5xl">
            {t("landing.services.sectionSubtitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("landing.services.sectionDescription")}
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${s.glow} ${
                s.highlight ? "neon-border md:-translate-y-3" : ""
              }`}
            >
              {/* Popular label */}
              {s.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-button !px-3 !py-1 text-xs">
                    {t("landing.services.mostPopular")}
                  </span>
                </div>
              )}

              {/* NEW badge */}
              {s.badge === "NEW" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    {s.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent}`}
              >
                <s.icon className="h-7 w-7 text-foreground" />
              </div>

              {/* Title + description */}
              <h3 className="font-sans text-lg font-semibold sm:text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>

              {/* Price */}
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-sans text-3xl font-bold neon-text sm:text-4xl">
                  {s.price}
                </span>
                <span className="text-sm text-muted-foreground">{s.unit}</span>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5">
                {s.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground/85"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  s.highlight
                    ? "gradient-button"
                    : "glass hover:border-white/20"
                }`}
              >
                {t("landing.services.quoteNow")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
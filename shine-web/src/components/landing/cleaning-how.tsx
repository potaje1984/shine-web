"use client";

/**
 * CleaningHowItWorks.tsx
 * Didactic visual explanation of the cleaning service lifecycle.
 * Uses a vertical timeline with detailed step cards and a visual flow diagram.
 */

import { motion } from "framer-motion";
import {
  Home,
  ClipboardCheck,
  UserCheck,
  Sparkles,
  ArrowDown,
  CalendarDays,
  MessageCircle,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CleaningHowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Home,
      title: t("landing.howCleaningWorks.step1.title"),
      desc: t("landing.howCleaningWorks.step1.description"),
      detail: t("landing.howCleaningWorks.step1.detail"),
      color: "cyan",
    },
    {
      icon: CalendarDays,
      title: t("landing.howCleaningWorks.visit.title"),
      desc: t("landing.howCleaningWorks.visit.description"),
      detail: t("landing.howCleaningWorks.visit.detail"),
      color: "cyan",
    },
    {
      icon: ClipboardCheck,
      title: t("landing.howCleaningWorks.step2.title"),
      desc: t("landing.howCleaningWorks.step2.description"),
      detail: t("landing.howCleaningWorks.step2.detail"),
      color: "amber",
    },
    {
      icon: MessageCircle,
      title: t("landing.howCleaningWorks.step3.title"),
      desc: t("landing.howCleaningWorks.step3.description"),
      detail: t("landing.howCleaningWorks.step3.detail"),
      color: "blue",
    },
    {
      icon: DollarSign,
      title: t("landing.howCleaningWorks.payment.title"),
      desc: t("landing.howCleaningWorks.payment.description"),
      detail: t("landing.howCleaningWorks.payment.detail"),
      color: "purple",
    },
    {
      icon: UserCheck,
      title: t("landing.howCleaningWorks.step4.title"),
      desc: t("landing.howCleaningWorks.step4.description"),
      detail: t("landing.howCleaningWorks.step4.detail"),
      color: "emerald",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; glow: string }> = {
    cyan: { bg: "bg-cyan-500/15", border: "border-cyan-500/20", text: "text-cyan-400", ring: "ring-cyan-500/30", glow: "from-cyan-500/10" },
    amber: { bg: "bg-amber-500/15", border: "border-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/30", glow: "from-amber-500/10" },
    blue: { bg: "bg-blue-500/15", border: "border-blue-500/20", text: "text-blue-400", ring: "ring-blue-500/30", glow: "from-blue-500/10" },
    purple: { bg: "bg-purple-500/15", border: "border-purple-500/20", text: "text-purple-400", ring: "ring-purple-500/30", glow: "from-purple-500/10" },
    emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/30", glow: "from-emerald-500/10" },
  };

  return (
    <section id="cleaning-how" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
            {t("landing.howCleaningWorks.sectionTitle")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold sm:text-3xl md:text-5xl">
            {t("landing.howCleaningWorks.sectionSubtitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("landing.howCleaningWorks.sectionDescription")}
          </p>
        </motion.div>

        {/* Visual Lifecycle Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-14"
        >
          <CleaningLifecycleDiagram />
        </motion.div>

        {/* Detailed Steps Timeline */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-500/30 via-amber-500/20 via-50% via-blue-500/20 via-75% to-emerald-500/30 md:left-1/2 md:block md:-translate-x-px"
          />

          {steps.map((s, i) => {
            const Icon = s.icon;
            const colors = colorMap[s.color] || colorMap.cyan;
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex items-start gap-4 md:gap-0 md:py-3"
              >
                {/* Icon node */}
                <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.bg} ring-1 ${colors.ring} md:mx-auto`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                  {/* Step number */}
                  <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}>
                    {i + 1}
                  </span>
                </div>

                {/* Content card */}
                <div className={`glass mt-1 flex-1 rounded-2xl p-5 ${colors.border} ${isLeft ? "md:ml-6 md:mr-0 md:w-[calc(50%-4rem)]" : "md:mr-6 md:ml-auto md:w-[calc(50%-4rem)]"}`}>
                  <h3 className="font-sans text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  {s.detail && (
                    <p className="mt-2 text-xs text-foreground/60 leading-relaxed border-t border-white/[0.06] pt-2">
                      {s.detail}
                    </p>
                  )}
                </div>

                {/* Arrow between steps (mobile) */}
                {i < steps.length - 1 && (
                  <div className="absolute left-6 -bottom-2 z-10 md:hidden">
                    <ArrowDown className="h-4 w-4 text-cyan-500/25" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"
        >
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-cyan-400" />
          <div>
            <p className="text-sm font-medium text-cyan-300">
              {t("landing.howCleaningWorks.securityTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {t("landing.howCleaningWorks.securityDesc")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Visual SVG Lifecycle Diagram ─── */

function CleaningLifecycleDiagram() {
  const { t } = useTranslation();

  const stages = [
    { label: t("diagram.request"), color: "#22d3ee", bg: "rgba(34,211,238,0.12)", icon: "1" },
    { label: t("diagram.visit"), color: "#22d3ee", bg: "rgba(34,211,238,0.12)", icon: "2" },
    { label: t("diagram.quote"), color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "3" },
    { label: t("diagram.accept"), color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "4" },
    { label: t("diagram.charge"), color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: "5" },
    { label: t("diagram.cleaning"), color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "6" },
  ];

  return (
    <div className="glass rounded-2xl border border-white/[0.06] p-5 sm:p-8">
      <h3 className="mb-6 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {t("diagram.lifecycleTitle")}
      </h3>

      {/* Desktop: horizontal flow */}
      <div className="hidden sm:block">
        <svg viewBox="0 0 700 120" className="w-full" fill="none">
          {/* Connection lines */}
          {stages.slice(0, -1).map((_, i) => {
            const x1 = 60 + i * 110;
            const x2 = 60 + (i + 1) * 110;
            return (
              <g key={i}>
                <line x1={x1 + 40} y1={55} x2={x2 - 8} y2={55} stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 3" />
                <polygon points={`${x2 - 12},50 ${x2 - 4},55 ${x2 - 12},60`} fill="rgba(255,255,255,0.15)" />
              </g>
            );
          })}

          {/* Stage nodes */}
          {stages.map((stage, i) => {
            const cx = 60 + i * 110;
            return (
              <g key={i}>
                <rect x={cx - 38} y={20} width={76} height={70} rx={14} fill={stage.bg} stroke={stage.color} strokeWidth="1.5" strokeOpacity={0.3} />
                <circle cx={cx} cy={42} r={12} fill={stage.color} fillOpacity={0.2} stroke={stage.color} strokeWidth="1" />
                <text x={cx} y={46} textAnchor="middle" fill={stage.color} fontSize="11" fontWeight="bold">{stage.icon}</text>
                <text x={cx} y={72} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="8.5" fontWeight="500">{stage.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile: vertical flow */}
      <div className="flex flex-col items-center gap-1 sm:hidden">
        {stages.map((stage, i) => (
          <div key={i} className="flex w-full items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: stage.bg, border: `1px solid ${stage.color}40` }}
            >
              <span style={{ color: stage.color }} className="text-xs font-bold">{stage.icon}</span>
            </div>
            <div className="flex-1 rounded-lg px-3 py-2" style={{ backgroundColor: stage.bg }}>
              <p className="text-xs font-medium" style={{ color: stage.color }}>{stage.label}</p>
            </div>
            {i < stages.length - 1 && (
              <div className="absolute left-[19px] -bottom-1 h-2 w-px" style={{ backgroundColor: `${stage.color}30` }} />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" /> {t("diagram.legendClient")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> {t("diagram.legendAssociate")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> {t("diagram.legendDecision")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400" /> {t("diagram.legendPayment")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t("diagram.legendComplete")}
        </span>
      </div>
    </div>
  );
}
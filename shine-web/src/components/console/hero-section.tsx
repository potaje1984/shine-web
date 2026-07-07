"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Layers, Zap } from "lucide-react";

const badges = [
  { icon: Layers, label: "Monorepo" },
  { icon: ShieldCheck, label: "Seguro por diseño" },
  { icon: Zap, label: "Tema futurista" },
];

export function HeroSection() {
  return (
    <section className="relative px-6 pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-6xl text-center">
        {/* Badge superior */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-foreground/80">
            Entorno inicializado · Codespaces listo
          </span>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 font-sans text-5xl font-bold tracking-tight md:text-7xl"
        >
          Lavandería Clean
          <br />
          <span className="neon-text">Monorepo Engineering Console</span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Arquitectura modular con{" "}
          <span className="font-semibold text-foreground">client-app</span> y{" "}
          <span className="font-semibold text-foreground">admin-dashboard</span>,
          respaldada por Firebase (Auth + Firestore + Storage) con reglas de
          seguridad por rol y un tema global glassmorphism en dark mode.
        </motion.p>

        {/* Badges de stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {badges.map((b) => (
            <div
              key={b.label}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            >
              <b.icon className="h-4 w-4 text-primary" />
              {b.label}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#architecture"
            className="gradient-button inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Explorar arquitectura
          </a>
          <a
            href="#firebase"
            className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:border-white/20"
          >
            Ver configuración Firebase
          </a>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const checklist = [
  { label: "Estructura /client-app + /admin-dashboard + /packages/shared", done: true },
  { label: "package.json raíz con workspaces y scripts (dev, build, lint, deploy)", done: true },
  { label: "Boilerplate Firebase modular (Auth + Firestore + Storage)", done: true },
  { label: "firestore.rules con RBAC (rol admin en users/{uid}.role)", done: true },
  { label: "firestore.indexes.json para consultas optimizadas", done: true },
  { label: "storage.rules con aislamiento por UID", done: true },
  { label: "Esquema de colecciones: users, orders, payments (+ factories)", done: true },
  { label: "Tema global dark mode + glassmorphism + gradientes", done: true },
  { label: "Tailwind + Framer Motion en client-app", done: true },
  { label: "Tailwind + Shadcn/UI en admin-dashboard", done: true },
  { label: ".env.example con NEXT_PUBLIC_* y ADMIN SDK (no commiteado)", done: true },
  { label: ".gitignore blindado contra credenciales", done: true },
];

export function StatusSection() {
  return (
    <section id="status" className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-2xl p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-sans text-2xl font-bold md:text-3xl">
              Estado del repositorio
            </h2>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Checklist de lo que ya está listo para que conectes tu proyecto de
            Firebase y empieces a desarrollar features.
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {checklist.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm text-foreground/90">{c.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 rounded-xl bg-primary/[0.06] p-4 sm:flex-row sm:items-center">
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground/90">
              <span className="font-semibold">Próximo paso:</span> copia{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
                monorepo/.env.example
              </code>{" "}
              a{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
                .env.local
              </code>{" "}
              en cada app y pega tus credenciales de Firebase Console.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

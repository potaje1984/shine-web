"use client";

import { motion } from "framer-motion";
import { Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";

const commands = [
  {
    title: "Instalar dependencias (workspaces)",
    cmd: "npm install",
    note: "Instala deps de client-app, admin-dashboard y shared en una sola operación.",
  },
  {
    title: "Configurar variables de entorno",
    cmd: "cp .env.example client-app/.env.local\ncp .env.example admin-dashboard/.env.local",
    note: "Edita cada .env.local con tus credenciales reales de Firebase Console.",
  },
  {
    title: "Levantar ambas apps en paralelo",
    cmd: "npm run dev",
    note: "client-app → localhost:3001 · admin-dashboard → localhost:3002",
  },
  {
    title: "Desplegar reglas de seguridad",
    cmd: "npm run deploy:rules",
    note: "Sube firestore.rules y storage.rules a tu proyecto Firebase.",
  },
];

export function QuickstartSection() {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section id="quickstart" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            04 · Puesta en marcha
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Quick <span className="neon-text">start</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cuatro pasos para tener el monorepo corriendo y conectado a tu
            proyecto Firebase.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {commands.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="font-sans text-sm font-semibold">{c.title}</h3>
              </div>

              <div className="group relative overflow-hidden rounded-lg bg-black/40">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
                  <Terminal className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    bash
                  </span>
                  <button
                    onClick={() => copy(c.cmd, i)}
                    className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    aria-label="Copiar comando"
                  >
                    {copied === i ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto px-3 py-3 font-mono text-xs text-foreground/90">
                  <code>{c.cmd}</code>
                </pre>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{c.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Palette, Moon, Sparkles, Layers3, Droplet } from "lucide-react";

const features = [
  {
    icon: Moon,
    title: "Dark Mode por defecto",
    desc: "Ambas apps forzan dark mode en el <html>. Light mode opt-in vía data-theme o clase .light.",
  },
  {
    icon: Droplet,
    title: "Glassmorphism",
    desc: "Tarjetas con backdrop-blur, transparencias (rgba blanco 4-8%) y bordes sutiles (1px white/8%).",
  },
  {
    icon: Sparkles,
    title: "Gradientes neón",
    desc: "Púrpura (270° 90% 65%) → Cian (190° 95% 55%). Usados en texto, bordes y sombras glow.",
  },
  {
    icon: Layers3,
    title: "CSS Variables HSL",
    desc: "Todos los colores como tokens HSL/OKLCH. Cambiar el tema = editar variables, no reescribir componentes.",
  },
];

const swatches = [
  { name: "--background", value: "240 20% 4%", desc: "Base oscura" },
  { name: "--primary", value: "270 90% 65%", desc: "Púrpura neón" },
  { name: "--accent", value: "190 95% 55%", desc: "Cian eléctrico" },
  { name: "--surface", value: "240 16% 8%", desc: "Tarjeta glass" },
  { name: "--success", value: "150 70% 50%", desc: "Verde estado" },
  { name: "--danger", value: "0 85% 65%", desc: "Rojo alerta" },
];

export function StyleSection() {
  return (
    <section id="style" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            05 · Estilo
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Tema <span className="neon-text">futurista</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sistema visual unificado aplicado a client-app y admin-dashboard:
            dark mode por defecto, gradientes lineales púrpura→cian, transparencias
            glassmorphism y tokens HSL reutilizables.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Paleta de colores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 glass-strong rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-sans text-base font-semibold">
              Paleta de tokens CSS
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {swatches.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3"
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-lg border border-white/10 shadow-glow"
                  style={{ background: `hsl(${s.value})` }}
                />
                <div className="min-w-0">
                  <code className="block truncate font-mono text-xs font-medium text-foreground">
                    {s.name}
                  </code>
                  <code className="block truncate font-mono text-[10px] text-muted-foreground">
                    hsl({s.value})
                  </code>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

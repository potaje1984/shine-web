"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Crown,
  Ban,
  FileWarning,
} from "lucide-react";

const rules = [
  {
    icon: UserCheck,
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    title: "Acceso por propietario",
    rule: "request.auth.uid == resource.data.userId",
    desc: "Los usuarios solo pueden leer y escribir documentos donde el campo userId coincide con su UID. Aplica a orders y payments.",
  },
  {
    icon: Crown,
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    title: "Rol admin (acceso total)",
    rule: "get(/users/$(uid)).data.role == 'admin'",
    desc: "El rol de admin se verifica leyendo users/{uid}.role en cada petición. Los administradores pueden leer, escribir y eliminar cualquier documento.",
  },
  {
    icon: Ban,
    color: "from-red-500/20 to-red-500/5",
    iconColor: "text-red-400",
    title: "Anti-escalada de privilegios",
    rule: "role == resource.data.role || isAdmin()",
    desc: "Un cliente NO puede cambiarse su propio rol a admin. Solo un admin existente puede asignar el rol admin a otro usuario.",
  },
  {
    icon: Lock,
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    title: "Anti-fraude en pedidos",
    rule: "status == resource.data.status (cliente)",
    desc: "Un cliente no puede modificar status ni total de sus propios pedidos. Solo el admin puede avanzar el estado o ajustar precios.",
  },
  {
    icon: FileWarning,
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    title: "Denegado por defecto",
    rule: "match /{document=**} { allow read, write: if false; }",
    desc: "Cualquier ruta no listada explícitamente está bloqueada. No hay acceso anónimo a ninguna colección.",
  },
  {
    icon: ShieldCheck,
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
    title: "Validación de schema",
    rule: "amount is float && amount >= 0",
    desc: "Las reglas validan tipos y rangos antes de permitir escritura. Total de pedido y monto de pago deben ser numéricos y no negativos.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            02 · Seguridad
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Reglas de <span className="neon-text">Firestore</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Seis principios de seguridad que gobiernan el acceso a las
            colecciones <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">users</code>,{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">orders</code> y{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">payments</code>.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass group rounded-2xl p-5 transition-all hover:border-white/20 hover:shadow-[0_0_24px_-2px_rgba(168,85,247,0.35)]"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${r.color}`}
              >
                <r.icon className={`h-5 w-5 ${r.iconColor}`} />
              </div>
              <h3 className="font-sans text-base font-semibold">{r.title}</h3>
              <code className="mt-2 block overflow-x-auto rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-accent">
                {r.rule}
              </code>
              <p className="mt-3 text-sm text-muted-foreground">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

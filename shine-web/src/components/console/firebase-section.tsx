"use client";

import { motion } from "framer-motion";
import { Database, Users, ShoppingBag, CreditCard, KeyRound } from "lucide-react";

const collections = [
  {
    name: "users",
    icon: Users,
    color: "text-purple-400",
    accent: "from-purple-500/20 to-purple-500/5",
    fields: [
      { name: "uid", type: "string", req: true },
      { name: "email", type: "string", req: true },
      { name: "displayName", type: "string", req: false },
      { name: "role", type: "'customer' | 'admin'", req: true },
      { name: "phone", type: "string | null", req: false },
      { name: "address", type: "Address | null", req: false },
      { name: "createdAt", type: "Timestamp", req: true },
      { name: "updatedAt", type: "Timestamp", req: true },
    ],
  },
  {
    name: "orders",
    icon: ShoppingBag,
    color: "text-cyan-400",
    accent: "from-cyan-500/20 to-cyan-500/5",
    fields: [
      { name: "userId", type: "string", req: true },
      { name: "serviceType", type: "ServiceType", req: true },
      { name: "status", type: "OrderStatus", req: true },
      { name: "items", type: "OrderItem[]", req: true },
      { name: "total", type: "float", req: true },
      { name: "currency", type: "string", req: true },
      { name: "pickupDate", type: "Date | null", req: false },
      { name: "deliveryDate", type: "Date | null", req: false },
      { name: "notes", type: "string | null", req: false },
      { name: "createdAt", type: "Timestamp", req: true },
    ],
  },
  {
    name: "payments",
    icon: CreditCard,
    color: "text-emerald-400",
    accent: "from-emerald-500/20 to-emerald-500/5",
    fields: [
      { name: "userId", type: "string", req: true },
      { name: "orderId", type: "string", req: true },
      { name: "amount", type: "float", req: true },
      { name: "currency", type: "string", req: true },
      { name: "method", type: "PaymentMethod", req: true },
      { name: "status", type: "PaymentStatus", req: true },
      { name: "transactionId", type: "string | null", req: false },
      { name: "createdAt", type: "Timestamp", req: true },
    ],
  },
];

const envVars = [
  { key: "NEXT_PUBLIC_FIREBASE_API_KEY", scope: "Cliente", safe: true },
  { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", scope: "Cliente", safe: true },
  { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", scope: "Cliente", safe: true },
  { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", scope: "Cliente", safe: true },
  { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", scope: "Cliente", safe: true },
  { key: "NEXT_PUBLIC_FIREBASE_APP_ID", scope: "Cliente", safe: true },
  { key: "FIREBASE_ADMIN_CLIENT_EMAIL", scope: "Solo servidor", safe: false },
  { key: "FIREBASE_ADMIN_PRIVATE_KEY", scope: "Solo servidor", safe: false },
];

export function FirebaseSection() {
  return (
    <section id="firebase" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            03 · Backend
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Firebase + <span className="neon-text">Firestore</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Boilerplate modular para Auth, Firestore y Storage con variables de
            entorno. Las claves del cliente son públicas (protegidas por reglas),
            las del Admin SDK son secretas y solo se usan en el servidor.
          </p>
        </div>

        {/* Colecciones */}
        <div className="grid gap-5 lg:grid-cols-3">
          {collections.map((c, idx) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent}`}
                >
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <code className="font-mono text-lg font-semibold text-foreground">
                    {c.name}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Colección Firestore
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {c.fields.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          f.req ? "bg-primary" : "bg-muted-foreground/40"
                        }`}
                      />
                      <code className="font-mono text-xs text-foreground/90">
                        {f.name}
                      </code>
                    </div>
                    <code className="font-mono text-[11px] text-muted-foreground">
                      {f.type}
                    </code>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Variables de entorno */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <div className="glass-strong overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-semibold">
                  Variables de entorno
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                .env.example → .env.local
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {envVars.map((v) => (
                <div
                  key={v.key}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <code className="font-mono text-xs text-foreground/90 md:text-sm">
                    {v.key}
                  </code>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        v.safe
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {v.scope}
                    </span>
                    <span
                      className={`text-[10px] ${
                        v.safe ? "text-emerald-400/60" : "text-red-400/60"
                      }`}
                    >
                      {v.safe ? "NEXT_PUBLIC_*" : "SECRETO"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

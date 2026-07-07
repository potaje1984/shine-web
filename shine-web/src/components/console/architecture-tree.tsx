"use client";

import { motion } from "framer-motion";
import { Folder, FolderOpen, FileCode2, FileJson, FileLock, FileCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Node =
  | { type: "folder"; name: string; desc?: string; children?: Node[]; highlight?: boolean }
  | { type: "file"; name: string; desc?: string; icon: LucideIcon; highlight?: boolean };

const tree: Node[] = [
  {
    type: "folder",
    name: "monorepo/",
    desc: "Raíz del workspace npm",
    children: [
      { type: "file", name: "package.json", desc: "Workspaces + scripts raíz", icon: FileJson, highlight: true },
      { type: "file", name: "firebase.json", desc: "Deploy config", icon: FileCog },
      { type: "file", name: ".env.example", desc: "Plantilla de variables", icon: FileCode2 },
      {
        type: "folder",
        name: "firebase/",
        desc: "Config + seguridad",
        children: [
          { type: "file", name: "firebase-config.js", desc: "Auth + Firestore + Storage", icon: FileCode2, highlight: true },
          { type: "file", name: "firestore.rules", desc: "Reglas por rol", icon: FileLock, highlight: true },
          { type: "file", name: "firestore.indexes.json", desc: "Índices compuestos", icon: FileJson },
          { type: "file", name: "storage.rules", desc: "Reglas de Storage", icon: FileLock },
          { type: "file", name: "schema.js", desc: "Esquema + factories", icon: FileCode2 },
        ],
      },
      {
        type: "folder",
        name: "packages/shared/",
        desc: "Tipos, constantes, utils",
        children: [
          { type: "file", name: "types.js", desc: "Tipos JSDoc", icon: FileCode2 },
          { type: "file", name: "constants.js", desc: "Enums compartidos", icon: FileCode2 },
          { type: "file", name: "utils.js", desc: "Helpers puros", icon: FileCode2 },
        ],
      },
      {
        type: "folder",
        name: "client-app/",
        desc: "Next.js + Tailwind + Framer Motion",
        highlight: true,
        children: [
          { type: "file", name: "package.json", desc: "Dependencias cliente", icon: FileJson },
          { type: "file", name: "tailwind.config.js", desc: "Tema futurista", icon: FileCog },
          { type: "file", name: "src/app/page.js", desc: "Landing animada", icon: FileCode2 },
          { type: "file", name: "src/app/globals.css", desc: "Glassmorphism CSS", icon: FileCode2 },
          { type: "file", name: "src/lib/firebase.js", desc: "Wrapper cliente", icon: FileCode2 },
        ],
      },
      {
        type: "folder",
        name: "admin-dashboard/",
        desc: "Next.js + Tailwind + Shadcn/UI",
        highlight: true,
        children: [
          { type: "file", name: "package.json", desc: "Dependencias admin", icon: FileJson },
          { type: "file", name: "components.json", desc: "Config Shadcn", icon: FileCog },
          { type: "file", name: "tailwind.config.ts", desc: "Tema admin", icon: FileCog },
          { type: "file", name: "src/app/page.tsx", desc: "Dashboard admin", icon: FileCode2 },
          { type: "file", name: "src/components/ui/", desc: "Button, Card, …", icon: FileCode2 },
          { type: "file", name: "src/lib/firebase.ts", desc: "Wrapper admin", icon: FileCode2 },
        ],
      },
    ],
  },
];

function TreeNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const pad = { paddingLeft: `${depth * 20 + 12}px` };

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex items-center gap-2 py-2 transition-colors hover:bg-white/[0.03]"
          style={pad}
        >
          {node.highlight ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          <span
            className={`font-mono text-sm ${
              node.highlight ? "font-semibold text-foreground" : "text-foreground/90"
            }`}
          >
            {node.name}
          </span>
          {node.desc && (
            <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
              — {node.desc}
            </span>
          )}
        </div>
        {node.children?.map((child, i) => (
          <TreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const Icon = node.icon;
  return (
    <div
      className={`flex items-center gap-2 py-1.5 transition-colors hover:bg-white/[0.03] ${
        node.highlight ? "bg-primary/[0.05]" : ""
      }`}
      style={pad}
    >
      <Icon className={`h-4 w-4 ${node.highlight ? "text-primary" : "text-accent"}`} />
      <span className="font-mono text-sm text-foreground/80">{node.name}</span>
      {node.desc && (
        <span className="ml-2 hidden text-xs text-muted-foreground md:inline">
          — {node.desc}
        </span>
      )}
    </div>
  );
}

export function ArchitectureTree() {
  return (
    <motion.section
      id="architecture"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="px-6 py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            01 · Estructura
          </p>
          <h2 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Árbol del <span className="neon-text">monorepo</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Workspaces npm gestionando dos apps Next.js independientes más un
            paquete compartido y la configuración centralizada de Firebase.
          </p>
        </div>

        <div className="glass-strong overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
            <div className="h-3 w-3 rounded-full bg-green-400/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              monorepo/ — árbol de archivos
            </span>
          </div>
          <div className="overflow-x-auto p-2">
            {tree.map((node, i) => (
              <TreeNode key={i} node={node} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

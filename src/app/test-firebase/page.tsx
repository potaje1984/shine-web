"use client";

import { useEffect, useState } from "react";
import { initFirebase, isFirebaseConfigured, hasFirebaseConfig, getFirebaseInitError, getAuthInstance, getFirestoreInstance } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

// Diagnóstico detallado por variable (se ejecuta en el cliente)
const ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

// Mapeo directo: nombre de variable de entorno → key en window.__FIREBASE_CONFIG__
const ENV_KEY_MAP: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "apiKey",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "authDomain",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "projectId",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "storageBucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
  NEXT_PUBLIC_FIREBASE_APP_ID: "appId",
};

function getEnvStatus() {
  const w = window as unknown as {
    __FIREBASE_CONFIG__?: Record<string, string>;
  };
  const config = w.__FIREBASE_CONFIG__;

  return Object.entries(ENV_KEY_MAP).map(([envKey, configKey]) => {
    const value = config?.[configKey] || process.env[envKey] || "";
    return { key: envKey, value, set: !!value };
  });
}

export default function TestFirebasePage() {
  const { user, profile, isAdmin, loading, signIn, signUp, signOut, error } =
    useAuth();
  const [dbStatus, setDbStatus] = useState<"idle" | "checking" | "ok" | "error">(
    "idle"
  );
  const [dbMessage, setDbMessage] = useState("");
  const [usersCount, setUsersCount] = useState<number | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  // Solo mostrar estado real en el cliente (evita hydration mismatch)
  const [clientReady, setClientReady] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [authReady, setAuthReady] = useState<boolean | null>(null);
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      setConfigured(hasFirebaseConfig());
      try {
        await initFirebase();
      } catch (e: any) {
        console.warn("[test-firebase] init error:", e);
      }
      const storedError = getFirebaseInitError();
      setInitError(storedError);
      setAuthReady(!!getAuthInstance());
      setDbReady(!!getFirestoreInstance());
      setClientReady(true);
    }
    check();
  }, []);

  // Diagnóstico de variables individuales (cliente)
  const [envStatus, setEnvStatus] = useState<
    Array<{ key: string; value: string; set: boolean }>
  >([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnvStatus(getEnvStatus());
  }, []);

  async function testConnection() {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    if (!dbInstance) {
      setDbStatus("error");
      setDbMessage("Firebase no inicializado. Revisa .env.local");
      return;
    }
    setDbStatus("checking");
    setDbMessage("Conectando a Firestore...");
    try {
      const snap = await getDocs(collection(dbInstance, "users"));
      setUsersCount(snap.size);
      setDbStatus("ok");
      setDbMessage(`✅ Conectado a Firestore. Colección 'users' tiene ${snap.size} documentos.`);
    } catch (err: any) {
      setDbStatus("error");
      setDbMessage(`❌ Error: ${err.message}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "signup") {
        await signUp({ email, password, displayName: name || undefined });
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      // el error ya está en el hook
    }
  }

  async function createTestDoc() {
    await initFirebase();
    const dbInstance = getFirestoreInstance();
    if (!dbInstance) return;
    try {
      await addDoc(collection(dbInstance, "test"), {
        message: "Hola desde test-firebase",
        createdAt: serverTimestamp(),
      });
      alert("✅ Documento creado en colección 'test'");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Diagnóstico
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold md:text-4xl">
            Test <span className="neon-text">Firebase</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Verifica que tu web está conectada al proyecto{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">
              shine-web-7b716
            </code>
            .
          </p>
        </div>

        {/* Card 1: Estado de configuración */}
        <section className="glass-strong mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-sans text-lg font-semibold">
            1. Estado de configuración
          </h2>
          <div className="space-y-2 text-sm">
            <Row label="Firebase SDK" value="Instalado" ok />
            <Row
              label="Variables de entorno"
              value={
                configured === null
                  ? "Cargando..."
                  : configured
                    ? "Configuradas"
                    : "Faltan variables"
              }
              ok={configured === null ? undefined : configured}
            />
            <Row
              label="SDK Firebase"
              value={clientReady ? (isFirebaseConfigured() ? "Inicializado" : "Error al inicializar") : "Cargando..."}
              ok={clientReady ? (isFirebaseConfigured() ? true : false) : undefined}
            />
            {clientReady && initError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 font-mono break-all">
                Error: {initError}
              </div>
            )}
            <Row
              label="Auth"
              value={clientReady ? (authReady ? "Listo" : "No inicializado") : "Cargando..."}
              ok={clientReady ? (authReady ?? undefined) : undefined}
            />
            <Row
              label="Firestore"
              value={clientReady ? (dbReady ? "Listo" : "No inicializado") : "Cargando..."}
              ok={clientReady ? (dbReady ?? undefined) : undefined}
            />
          </div>
          {configured === false && (
            <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300">
              ⚠️ Faltan variables NEXT_PUBLIC_FIREBASE_* en tu .env.local.
              Copia .env.example a .env.local y reinicia el dev server.
            </div>
          )}

          {/* Detalle por variable */}
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Detalle por variable:
            </p>
            <div className="space-y-1">
              {envStatus.map((v) => (
                <div
                  key={v.key}
                  className="flex items-center justify-between gap-2 rounded bg-white/[0.02] px-2 py-1.5 text-xs"
                >
                  <code className="font-mono text-foreground/80">{v.key}</code>
                  <div className="flex items-center gap-2">
                    {v.set ? (
                      <>
                        <code className="font-mono text-emerald-400">
                          {v.value.slice(0, 12)}
                          {v.value.length > 12 ? "..." : ""}
                        </code>
                        <span className="text-emerald-400">✓</span>
                      </>
                    ) : (
                      <span className="text-red-400">✗ vacía</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              💡 Si todas están en ✓ pero "Variables de entorno" dice
              &quot;Faltan variables&quot;, recarga con Ctrl+Shift+R o reinicia
              el dev server.
            </p>
          </div>
        </section>

        {/* Card 2: Test de conexión Firestore */}
        <section className="glass-strong mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-sans text-lg font-semibold">
            2. Test de conexión Firestore
          </h2>
          <button
            onClick={testConnection}
            disabled={dbStatus === "checking"}
            className="gradient-button inline-flex items-center gap-2 text-sm"
          >
            {dbStatus === "checking" ? "Probando..." : "Probar conexión"}
          </button>
          {dbMessage && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                dbStatus === "ok"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : dbStatus === "error"
                    ? "bg-red-500/10 text-red-300"
                    : "bg-white/5 text-foreground/80"
              }`}
            >
              {dbMessage}
            </div>
          )}
          {dbStatus === "ok" && (
            <button
              onClick={createTestDoc}
              className="mt-3 inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-xs font-semibold transition-all hover:border-white/20"
            >
              + Crear documento de prueba
            </button>
          )}
        </section>

        {/* Card 3: Auth */}
        <section className="glass-strong mb-6 rounded-2xl p-6">
          <h2 className="mb-4 font-sans text-lg font-semibold">
            3. Autenticación
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando sesión...</p>
          ) : user ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
                ✅ Sesión activa
              </div>
              <Row label="UID" value={user.uid || "—"} mono />
              <Row label="Email" value={user.email || "—"} />
              <Row label="Display name" value={profile?.displayName || "—"} />
              <Row
                label="Rol"
                value={profile?.role || "sin perfil"}
                ok={profile?.role === "admin"}
              />
              {isAdmin && (
                <div className="rounded-lg bg-purple-500/10 p-3 text-xs text-purple-300">
                  👑 Eres admin. Tienes acceso total al admin-dashboard.
                </div>
              )}
              <button
                onClick={signOut}
                className="mt-2 inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-xs font-semibold transition-all hover:border-white/20"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    mode === "signup"
                      ? "gradient-button"
                      : "glass hover:border-white/20"
                  }`}
                >
                  Registrarse
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    mode === "signin"
                      ? "gradient-button"
                      : "glass hover:border-white/20"
                  }`}
                >
                  Iniciar sesión
                </button>
              </div>

              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              )}
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                type="password"
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="gradient-button w-full text-sm"
              >
                {mode === "signup" ? "Crear cuenta" : "Entrar"}
              </button>
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">
                  ❌ {error}
                </div>
              )}
            </form>
          )}
        </section>

        {/* Card 4: Instrucciones si falla */}
        <section className="glass-strong rounded-2xl p-6">
          <h2 className="mb-4 font-sans text-lg font-semibold">
            4. ¿Algo falla? Checklist
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">1.</strong> En Firebase Console
              → <strong>Firestore Database</strong> → Create database (test mode
              OK para empezar)
            </li>
            <li>
              <strong className="text-foreground">2.</strong> En Firebase Console
              → <strong>Authentication</strong> → Sign-in method → habilita
              Email/Password
            </li>
            <li>
              <strong className="text-foreground">3.</strong> Verifica que{" "}
              <code className="rounded bg-white/5 px-1 font-mono text-xs">
                .env.local
              </code>{" "}
              tiene las 6 variables NEXT_PUBLIC_FIREBASE_*
            </li>
            <li>
              <strong className="text-foreground">4.</strong> Reinicia:{" "}
              <code className="rounded bg-white/5 px-1 font-mono text-xs">
                rm -rf .next && npm run dev
              </code>
            </li>
            <li>
              <strong className="text-foreground">5.</strong> Si dice
              &quot;Missing permissions&quot;, deploya reglas:{" "}
              <code className="rounded bg-white/5 px-1 font-mono text-xs">
                cd monorepo && firebase deploy --only firestore:rules
              </code>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  ok,
  mono,
}: {
  label: string;
  value: string;
  ok?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.02] px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-xs ${mono ? "font-mono" : ""} ${
          ok === undefined
            ? "text-foreground/80"
            : ok
              ? "text-emerald-400"
              : "text-red-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

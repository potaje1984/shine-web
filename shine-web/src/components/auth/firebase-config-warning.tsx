"use client";

/**
 * FirebaseConfigWarning.tsx
 * Banner que muestra un error claro cuando la configuración de Firebase
 * falta o es inválida (ej: .env.local no existe en el Codespace).
 */

import { useState, useEffect } from "react";
import { getFirebaseConfigError } from "@/lib/firebase";
import { useTranslation } from "@/lib/i18n";

export function FirebaseConfigWarning() {
  const { t } = useTranslation();
  const [configError, setConfigError] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    setConfigError(getFirebaseConfigError());
  }, []);

  if (!clientReady) return null;
  if (!configError) return null;

  return (
    <div className="w-full max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
      <p className="text-sm font-semibold text-amber-400">
        {t("auth.firebaseWarning.title")}
      </p>
      <p className="mt-1 text-xs text-amber-300/80">
        {configError}
      </p>
      <div className="mt-3 rounded-md bg-black/30 p-2">
        <code className="text-xs text-amber-200">
          cp .env.example .env.local
        </code>
        <p className="mt-1 text-xs text-amber-300/70">
          {t("auth.firebaseWarning.description")}
        </p>
      </div>
    </div>
  );
}
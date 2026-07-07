"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import en from "./locales/en";
import es from "./locales/es";

export type Locale = "en" | "es";

// Use loose typing to allow es.ts to have regular strings vs en.ts const assertions
const translations: Record<Locale, Record<string, unknown>> = { en, es };

// Resolve a nested key path to its string value
function resolve(
  obj: Record<string, unknown>,
  path: string
): string | string[] | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object")
      return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as string | string[] | undefined;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("shine-locale");
  if (stored === "en" || stored === "es") return stored;
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  React.useEffect(() => {
    setLocaleState(getStoredLocale());
    setHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("shine-locale", newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[locale] as unknown as Record<string, unknown>;
      const raw = resolve(dict, key);
      if (raw === undefined) return key;
      if (Array.isArray(raw)) return raw.join(", ");
      let result = String(raw);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{${k}}`, String(v));
        }
      }
      return result;
    },
    [locale]
  );

  const tArray = useCallback(
    (key: string): string[] => {
      const dict = translations[locale] as unknown as Record<string, unknown>;
      const raw = resolve(dict, key);
      if (Array.isArray(raw)) return raw;
      return raw !== undefined ? [String(raw)] : [];
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tArray }),
    [locale, setLocale, t, tArray]
  );

  // Don't render children until we've hydrated from localStorage
  // to avoid language flash
  if (!hydrated) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}

// Re-export types
export type { TranslationKeys } from "./locales/en";